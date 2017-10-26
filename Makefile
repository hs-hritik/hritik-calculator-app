#
# Makefile for mirkwood project
#

SHELL=/bin/bash

# Add ./tools directory to path
export PATH := $(abspath ./tools):$(PATH)

#
# set defaults for the tools, this can be overriden using env
# variables
#
GULP ?= gulp
NPM ?= npm

JS_TEST_TARGETS = reactjs
GUNPOWDER_SRC = node_modules/@helpshiftdev/gunpowder/resources/static/scripts/*
GUNPOWDER_DEST = resources/static/scripts/gunpowder

# If GERRIT_CHANGE_ID is set, it implies that the Makefile is invoked
# on Jenkins. Run only those tests and validations that matter. Decide
# this using the types of files that have been changed in the most
# recent commit. For example, if only JavaScript was changed, skip
# tests for HTML and CSS.
ifdef GERRIT_CHANGE_ID
	git_diff = $(shell sh -c 'git diff-tree --no-commit-id --name-only --root -m -r HEAD')
	js_diff = $(shell sh -c "echo $(git_diff) | xargs -n 1 | grep -E 'scripts/.+\.js$$|__tests__/src/.+\.js$$|scripts/.+\.jsx$$|__tests__/src/.+\.jsx$$'")
	eslint_prefixed_js_diff = $(addprefix -f ,$(js_diff))
	styles_diff = $(shell sh -c "echo $(git_diff) | grep 'styles/.*\.scss'")
	makefile_diff = $(shell sh -c "echo $(git_diff) | grep Makefile")

	ifneq ($(eslint_prefixed_js_diff),)
		TEST_TARGETS := $(TEST_TARGETS) npminstall gunpowder reactjs eslint
		JS_TEST_TARGETS := $(JS_TEST_TARGETS) eslint
	endif

	ifneq ($(styles_diff),)
		TEST_TARGETS := $(TEST_TARGETS) sass-lint
	endif

	ifneq ($(makefile_diff),)
		TEST_TARGETS := gunpowder reactjs sass-lint
	endif
else
	TEST_TARGETS := eslint gunpowder reactjs sass-lint
endif

static: dist

bundlerinstall:
	@echo "\nEnsuring Bundler Installation for SCSS compilation..."
	bundler install

styles: npminstall bundlerinstall
	@echo "\nCompile and Lint Sass files in resources/styles folder..."
	@cd resources && $(GULP) sass:compile

sass-lint: npminstall bundlerinstall
	@echo "\nLint Sass files in resources/styles folder..."
	@cd resources && $(GULP) sass:lint

npminstall:
	$(NPM) install

compress-js: npminstall
	@echo "\nCompress JS..."
	$(GULP) --gulpfile "resources/gulpfile.babel.js" uglify

# eslint is only to be run when js files changed because we want to
# always ensure that new changes obey the rules but the unchanged
# files may not obey new rules.
eslint: npminstall
	@echo "\nRunning eslint on js & jsx files."
	$(NPM) install resources/static/eslint;
	$(GULP) --gulpfile "resources/gulpfile.babel.js" eslint $(eslint_prefixed_js_diff);

reactjs: npminstall
	@echo "\nCompile JSX..."
	@cd resources && $(GULP) babel --production

js-libs: npminstall
	@echo "\nOverwrite minified libs..."
	@cd resources && $(GULP) overwrite-min
	@echo "\nDone..."

gunpowder: npminstall
	@echo "Copying gunpowder files to scripts dir"
	@mkdir -p $(GUNPOWDER_DEST);
	@cp -r $(GUNPOWDER_SRC) $(GUNPOWDER_DEST);
	@echo "Done"

# The dist task is to compile and compress resources and
# copy them to the `dist` directory.
# All resources to be deployed must be copied to the `dist` directory.
# The styles, gunpowder, and reactjs tasks already copy files to the dist
# directory, so copying html, libs, and fonts to dist here.
# Create a symlink for messenger.js (the web messenger entry script file) to
# the dist directory.
dist: prepare-dist npminstall styles gunpowder reactjs compress-js js-libs copy-html-libs prepare-subdir ec2 azure localshiva clean-subdir

# The distdev task is to npm install resources and call the gulp task to
# set the local environment up.
distdev: npminstall gunpowder localhost

prepare-dist:
	@echo "Creating the dist directory"
	@mkdir -p resources/dist
	@mkdir -p resources/dist/demo
	@echo "Done"

copy-html-libs:
	@cp -R resources/static/{html,libs,fonts} resources/dist

copy-temp:
	@mkdir -v resources/build
	@mv -v resources/dist/* resources/build/

prepare-ec2:
	@echo "Creating ec2 subdirectory in the dist directory"
	@mkdir resources/dist/ec2
	@echo "Done"

prepare-azure:
	@echo "Creating azure subdirectory in the dist directory"
	@mkdir resources/dist/azure
	@echo "Done"

prepare-locashiva:
	@echo "Creating localshiva subdirectory in the dist directory"
	@mkdir resources/dist/localshiva
	@echo "Done"

prepare-subdir: copy-temp prepare-ec2 prepare-azure prepare-locashiva

ec2:
	@cp -R resources/build/* resources/dist/ec2/
	@cd resources/dist/ec2; ln -sv scripts/external/messenger.js webChat.js;
	@cd resources/dist/ec2/demo; ln -sv ../html/demo/index.html .;
	@cd resources && $(GULP) build-ec2

azure:
	@cp -R resources/build/* resources/dist/azure/
	@cd resources/dist/azure; ln -sv scripts/external/messenger.js webChat.js;
	@cd resources/dist/azure/demo; ln -sv ../html/demo/index.html .;
	@cd resources && $(GULP) build-azure

localshiva:
	@cp -R resources/build/* resources/dist/localshiva/
	@cd resources/dist/localshiva; ln -sv scripts/external/messenger.js webChat.js;
	@cd resources/dist/localshiva/demo; ln -sv ../html/demo/index.html .;
	@cd resources && $(GULP) build-localshiva

localhost:
	@cd resources && $(GULP) build-localhost;
	@mkdir -p resources/localhost/demo

clean-dev:
	@echo "Running make clean to clean the dist directory"
	@rm -rf resources/localhost
	@rm -rf resources/static/scripts/gunpowder
	@echo "Done"

clean:
	@echo "Running make clean to clean the dist directory"
	@rm -rf resources/dist
	@rm -rf resources/static/scripts/gunpowder
	@echo "Done"

clean-subdir:
	@echo "Cleaning dist directory"
	@rm -rf resources/build
	@echo "Done"

jstests: $(JS_TEST_TARGETS)

test: clean $(TEST_TARGETS)

.PHONY: test
