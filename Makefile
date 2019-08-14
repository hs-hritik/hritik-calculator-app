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
NODE ?= node

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
	js_diff = $(shell sh -c "echo $(git_diff) | xargs -n 1 | grep -E 'scripts/.+\.js$$|__tests__/.+\.js$$|scripts/.+\.jsx$$|__tests__/.+\.jsx$$'")
	eslint_prefixed_js_diff = $(addprefix -f ,$(js_diff))
	styles_diff = $(shell sh -c "echo $(git_diff) | grep 'styles/.*\.scss'")
	makefile_diff = $(shell sh -c "echo $(git_diff) | grep Makefile")

	ifneq ($(eslint_prefixed_js_diff),)
		TEST_TARGETS := $(TEST_TARGETS) npminstall gunpowder reactjs eslint unit-test
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

styles: npminstall
	@echo ">> Starting task: $@"
	@echo "Compiling and Linting Sass files in resources/styles folder"
	@cd resources && $(GULP) sass:compile
	@echo ">> Finished task: $@"

sass-lint: npminstall
	@echo ">> Starting task: $@"
	@echo "Lint Sass files in resources/styles folder"
	@cd resources && $(GULP) sass:lint
	@echo ">> Finished task: $@"

npminstall:
	@echo ">> Starting task: $@"
	@echo "Installing node packages"
	$(NPM) install
	@echo ">> Finished task: $@"

# eslint is only to be run when js files changed because we want to
# always ensure that new changes obey the rules but the unchanged
# files may not obey new rules.
eslint: npminstall
	@echo ">> Starting task: $@"
	@echo "Running eslint on JS & JSX files."
	$(NPM) install resources/static/eslint;
	$(GULP) --gulpfile "resources/gulpfile.babel.js" eslint $(eslint_prefixed_js_diff);
	@echo ">> Finished task: $@"

reactjs: npminstall
	@echo ">> Starting task: $@"
	@echo "Compiling JSX"
	@cd resources && $(GULP) babel --production
	@echo ">> Finished task: $@"

gunpowder: npminstall
	@echo ">> Starting task: $@"
	@echo "Copying gunpowder files to scripts dir"
	@mkdir -p $(GUNPOWDER_DEST);
	@cp -r $(GUNPOWDER_SRC) $(GUNPOWDER_DEST);
	@echo ">> Finished task: $@"

bundle-js:
	@echo ">> Starting task: $@"
	@echo "Bundling and minifying js files"
	$(NODE) r.js -o build.js
	@echo "Bundle generated"
	@echo "Cleaning unwanted js files"
	@cd resources && $(GULP) clean-unwanted-js
	@echo ">> Finished task: $@"

bundle-libs:
	@echo ">> Starting task: $@"
	@echo "Bundling minified libs"
	@cd resources && $(GULP) bundle-libs
	@echo ">> Finished task: $@"

# Minify external JS files. The bundle-js task doesn't minify the external
# JS files like messenger.js and redirection.js because these files are not
# a part of the dependency tree of the app's entry point (pages/webSdk). Also,
# these files are not supposed to be bundled together.
minify-ext-js:
	@echo ">> Starting task: $@"
	@echo "Bundling external JS files"
	@cd resources && $(GULP) minify-ext-js
	@echo ">> Finished task: $@"

sri:
	@echo ">> Starting task: $@"
	@echo "Starting SRI related tasks"
	@cd resources && $(GULP) generate-sri
	@echo ">> Finished task: $@"

# The dist task is to compile and compress resources and
# copy them to the `dist` directory.
# All resources to be deployed must be copied to the `dist` directory.
# The styles, gunpowder, and reactjs tasks already copy files to the dist
# directory, so copying html, libs, and fonts to dist here.
# Create a symlink for messenger.js (the web messenger entry script file) to
# the dist directory.
dist: prepare-dist npminstall \
	styles gunpowder reactjs copy-html-libs \
	bundle-js bundle-libs minify-ext-js \
	prepare-subdir ec2 azure localshiva sri \
	clean-subdir

# The distdev task is to npm install resources and call the gulp task to
# set the local environment up.
distdev: npminstall gunpowder localhost

prepare-dist:
	@echo ">> Starting task: $@"
	@echo "Creating the dist directory"
	@mkdir -p resources/dist
	@mkdir -p resources/dist/demo
	@echo ">> Finished task: $@"

copy-html-libs:
	@echo ">> Starting task: $@"
	@echo "Copying HTML, libs, fonts, and assets to the dist dir"
	@cp -R resources/static/{html,libs,fonts,assets} resources/dist
	@echo ">> Finished task: $@"

copy-temp:
	@echo ">> Starting task: $@"
	@mkdir -v resources/build
	@mv -v resources/dist/* resources/build/

prepare-ec2:
	@echo ">> Starting task: $@"
	@echo "Creating ec2 subdirectory in the dist directory"
	@mkdir resources/dist/ec2
	@echo ">> Finished task: $@"

prepare-azure:
	@echo ">> Starting task: $@"
	@echo "Creating azure subdirectory in the dist directory"
	@mkdir resources/dist/azure
	@echo ">> Finished task: $@"

prepare-locashiva:
	@echo ">> Starting task: $@"
	@echo "Creating localshiva subdirectory in the dist directory"
	@mkdir resources/dist/localshiva
	@echo ">> Finished task: $@"

prepare-subdir: copy-temp prepare-ec2 prepare-azure prepare-locashiva

ec2:
	@echo ">> Starting task: $@"
	@echo "Preparing build dir for EC2"
	@cp -R resources/build/* resources/dist/ec2/
	@cd resources/dist/ec2; ln -sv scripts/external/messenger.js webChat.js;
	@cd resources/dist/ec2/demo; ln -sv ../html/demo/index.html .;
	@cd resources && $(GULP) build-ec2
	@echo ">> Finished task: $@"

azure:
	@echo ">> Starting task: $@"
	@echo "Preparing build dir for Azure"
	@cp -R resources/build/* resources/dist/azure/
	@cd resources/dist/azure; ln -sv scripts/external/messenger.js webChat.js;
	@cd resources/dist/azure/demo; ln -sv ../html/demo/index.html .;
	@cd resources && $(GULP) build-azure
	@echo ">> Finished task: $@"

localshiva:
	@echo ">> Starting task: $@"
	@echo "Preparing build dir for localshiva"
	@cp -R resources/build/* resources/dist/localshiva/
	@cd resources/dist/localshiva; ln -sv scripts/external/messenger.js webChat.js;
	@cd resources/dist/localshiva/demo; ln -sv ../html/demo/index.html .;
	@cd resources && $(GULP) build-localshiva
	@echo ">> Finished task: $@"

localhost:
	@echo ">> Starting task: $@"
	@echo "Preparing build dir for localhost"
	@cd resources && $(GULP) build-localhost;
	@mkdir -p resources/localhost/demo
	@echo ">> Finished task: $@"

# Start Sonarqube scanner
scan:
	@echo ">> Starting task: $@"
	@echo "Starting Sonarqube scanner"
	sonar-scanner -Dsonar.projectVersion=1.0
	@echo ">> Finished task: $@"

# Start unit tests
unit-test:
	@echo ">> Starting task: $@"
	@echo "Starting unit tests"
	$(NPM) test
	@echo ">> Finished task: $@"

clean-dev:
	@echo ">> Starting task: $@"
	@echo "Running make clean to clean the dist directory"
	@rm -rf resources/localhost
	@rm -rf resources/static/scripts/gunpowder
	@echo ">> Finished task: $@"

clean:
	@echo ">> Starting task: $@"
	@echo "Running make clean to clean the dist directory"
	@rm -rf resources/dist
	@rm -rf resources/static/scripts/gunpowder
	@echo ">> Finished task: $@"

clean-subdir:
	@echo ">> Starting task: $@"
	@echo "Cleaning dist directory"
	@rm -rf resources/build
	@echo ">> Finished task: $@"

jstests: $(JS_TEST_TARGETS)

test: clean $(TEST_TARGETS)

.PHONY: test
