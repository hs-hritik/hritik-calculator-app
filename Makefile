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
STATIC_PATH ?= $(abspath ./resources)/static
DIST_PATH ?= $(abspath ./resources)/dist

JS_TEST_TARGETS = reactjs

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
	@echo "\nInstalling the gunpowder npm package"
	@mkdir -p resources/static/scripts/gunpowder/node_modules;
	$(NPM) install --prefix resources/static/scripts/gunpowder;

# The dist task is to compile and compress resources and
# copy them to the `dist` directory.
# All resources to be deployed must be copied to the `dist` directory.
# The styles gunpowder, and reactjs tasks already copy files to the dist
# directory, so copying html, libs, and fonts to dist here.
# Create a symlink for messenger.js (the web messenger entry script file) to
# the dist directory.
dist: npminstall styles gunpowder reactjs compress-js js-libs
	@echo "\nBuilding the dist directory"
	@mkdir -p resources/dist
	@cp -R resources/static/{html,libs,fonts} resources/dist
	@ln -sfv $(DIST_PATH)/scripts/external/messenger.js resources/dist/webmessenger.js
	@echo "\nDone..."

# The distdev task to compile resources and link the dev files to dist directory
distdev: npminstall styles gunpowder reactjs
	@echo "\nCreating/updating symlinks for dev directories in the dist directory"
	@ln -sFv $(STATIC_PATH)/{html,libs,fonts} resources/dist
	@ln -sfv $(DIST_PATH)/scripts/external/messenger.js resources/dist/webmessenger.js
	@echo "\nDone..."

clean:
	@echo "\n Running make clean to clean the dist directory"
	@rm -rf resources/dist
	@echo "\nDone..."

jstests: $(JS_TEST_TARGETS)

test: $(TEST_TARGETS)

.PHONY: test
