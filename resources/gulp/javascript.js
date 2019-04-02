/* eslint-disable strict, no-console */

const gulp = require ("gulp");
const babel = require ("gulp-babel");
const rename = require ("gulp-rename");
const print = require ("gulp-print");
const notifier = require ("node-notifier");
const {argv} = require ("yargs");
const {getTimeStamp} = require ("./utils");
const gutil = require ("gulp-util");
const replace = require ("gulp-replace");
const runSequence = require ("run-sequence");
const concat = require ("gulp-concat");
const del = require ("del");
const uglify = require ("gulp-uglify");

/**
 * Webchat version
 */
const WEB_CHAT_VERSION = "2.18.0";

/**
 * Name of app bundle
 */
const APP_BUNDLE_NAME = "app";

/**
 * Name of library bundle
 */
const LIBS_BUNDLE_NAME = "libs";

const PATHS = {
  scriptsSrc: "static/scripts/**/*.+(js|jsx)",
  scriptsDest: "dist/scripts",
  scriptsDestDev: "localhost/scripts",

  libsSrc: "static/libs/**/*.js",
  libsDest: "dist/libs",
  libsDestDev: "localhost/libs/",

  // Env specific paths
  ec2Source: ["dist/ec2/**/*.*", "!dist/ec2/fonts/**/*.*"],
  ec2Dest: "dist/ec2/",
  azureSource: ["dist/azure/**/*.*", "!dist/azure/fonts/**/*.*"],
  azureDest: "dist/azure/",
  localshivaSource: ["dist/localshiva/**/*.*", "!dist/localshiva/fonts/**/*.*"],
  localshivaDest: "dist/localshiva/",
  localhostSource: ["localhost/**/*.*", "!localhost/fonts/**/*.*"],
  localhostDest: "localhost/",

  // Specific paths to run the local server
  webChatSrcDev: "localhost/scripts/external/messenger.js",

  // Library bundle specific path
  // @NOTE - Any new file added to libs folder will not be automatically minified
  // You will have to add it explicity to following array.
  bundleLibsSource: [
    "static/libs/react-with-addons-min.js",
    "static/libs/react-dom-min.js",
    "static/libs/redux-min.js",
    "static/libs/react-redux-min.js",
    "static/libs/require-min.js"
  ],

  // This is the source of files to be removed once libs bundle is generated
  // Basically remove all the file inside dist/libs except for libs-min.js
  unwantedLibsSource: [
    "dist/libs/**/*",
    `!dist/libs/${LIBS_BUNDLE_NAME}-min.js`
  ],

  // App bundle specific path
  unwantedAppSource: [
    "dist/scripts/**/*",
    `!dist/scripts/${APP_BUNDLE_NAME}-min.js`,
    `!dist/scripts/${APP_BUNDLE_NAME}-min.js.map`,
    "!dist/scripts/external/**"
  ],

  externalJsSrc: "dist/scripts/external/*.js",
  externalJsDest: "dist/scripts/external/"
};

/**
 * Paths used in templating
 */
const TEMPLATE_PATHS = {
  LIBS: {
    DEV: `
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/react-with-addons.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/react-dom.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/redux.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/react-redux.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/require.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/scripts/requireConfig.js"></script>
    `,
    PROD: `<script src="{{ENV_WEB_CHAT_ROOT}}/libs/libs-min.js?v=${WEB_CHAT_VERSION}"></script>`
  },
  APP: {
    DEV: "<script src=\"{{ENV_WEB_CHAT_ROOT}}/scripts/pages/webSdk.js\"></script>",
    PROD: `<script src="{{ENV_WEB_CHAT_ROOT}}/scripts/app-min.js?v=${WEB_CHAT_VERSION}"></script>`
  }
};

/**
 * Run babel on a given source folder
 * @param {string} srcFolder - Source directory to compile
 * @param {string} destFolder - Destination directory to write to
 * @param [boolean] errorGrowl - True to show error notification
 * @returns {Object} - Stream of files
 */
const babelCompile = function (srcFolder, destFolder, errorGrowl) {
  return gulp.src (srcFolder)
    .pipe (babel ().on ("error", function (err) {
      if (errorGrowl) {
        notifier.notify ("Oops! Babel compile error!");
      }
      gutil.log (err);
    }))
    .pipe (gulp.dest (destFolder))
    .pipe (print (function (filepath) {
      return `Compiled: ${filepath} ${getTimeStamp ()}`;
    }));
};

/**
 * Watch a given JavaScript source folder
 * @param {string} srcFolder - Source directory to watch
 * @param {string} destFolder - Destination directory to write to
 * @param [string] separator - Delimiter to identify file name
 */
const babelWatch = (srcFolder, destFolder, separator = "/scripts/") => {
  const watcher = gulp.watch (srcFolder, () => {
    runSequence ("replace-localhost", "copy-webchat");
  });

  watcher.on ("change", function (event) {
    const filePath = event.path.split ("/resources/") [1];
    let destPath = filePath.split (separator) [1];
    destPath = `${destFolder}/${destPath}`;
    destPath = destPath.replace (/\/.[^\/]*$/, "/");

    babelCompile (filePath, destPath, true);
  });
};

/**
 * Compiles/watches js/jsx files. Only meant for production.
 */
gulp.task ("babel", function () {
  if (argv.production || argv.prod) {
    babelCompile (PATHS.scriptsSrc, PATHS.scriptsDest);
  }
});

/**
 * Production task.
 * Replace EC2 specific template strings with given values
 */
gulp.task ("build-ec2", function () {
  gulp.src (PATHS.ec2Source)
      .pipe (replace ("{{TEMPLATES_LIB_PATH}}", TEMPLATE_PATHS.LIBS.PROD, {
        skipBinary: true
      }))
      .pipe (replace ("{{TEMPLATES_APP_PATH}}", TEMPLATE_PATHS.APP.PROD, {
        skipBinary: true
      }))
      .pipe (replace ("{{ENV_WEB_CHAT_ROOT}}", "https://webchat.helpshift.com", {
        skipBinary: true
      }))
      .pipe (replace ("{{ENV_API_ROOT}}", "https://api.helpshift.com", {
        skipBinary: true
      }))
      .pipe (gulp.dest (PATHS.ec2Dest));
});

/**
 * Production task.
 * Replace Azure specific template strings with given values
 */
gulp.task ("build-azure", function () {
  gulp.src (PATHS.azureSource)
      .pipe (replace ("{{TEMPLATES_LIB_PATH}}", TEMPLATE_PATHS.LIBS.PROD, {
        skipBinary: true
      }))
      .pipe (replace ("{{TEMPLATES_APP_PATH}}", TEMPLATE_PATHS.APP.PROD, {
        skipBinary: true
      }))
      .pipe (replace ("{{ENV_WEB_CHAT_ROOT}}", "https://webchat-a.helpshift.com", {
        skipBinary: true
      }))
      .pipe (replace ("{{ENV_API_ROOT}}", "https://api-a.helpshift.com", {
        skipBinary: true
      }))
      .pipe (gulp.dest (PATHS.azureDest));
});

/**
 * Production task.
 * Replace localshiva (staging) specific template strings with given values
 */
gulp.task ("build-localshiva", function () {
  gulp.src (PATHS.localshivaSource)
      .pipe (replace ("{{TEMPLATES_LIB_PATH}}", TEMPLATE_PATHS.LIBS.PROD, {
        skipBinary: true
      }))
      .pipe (replace ("{{TEMPLATES_APP_PATH}}", TEMPLATE_PATHS.APP.PROD, {
        skipBinary: true
      }))
      .pipe (replace ("{{ENV_WEB_CHAT_ROOT}}", "https://webchat.helpshift.mobi", {
        skipBinary: true
      }))
      .pipe (replace ("{{ENV_API_ROOT}}", "https://api.helpshift.mobi", {
        skipBinary: true
      }))
      .pipe (gulp.dest (PATHS.localshivaDest));
});

/**
 * Copy libs from source dir (workspace) to destination dir (server)
 */
gulp.task ("libs", () => {
  return gulp.src (PATHS.libsSrc)
    .pipe (gulp.dest (PATHS.libsDestDev));
});

/**
 * Task to combine given libs in single bundle file
 */
gulp.task ("bundle-libs", function () {
  gulp.src (PATHS.bundleLibsSource)
    .pipe (concat (`${LIBS_BUNDLE_NAME}-min.js`))
    .pipe (gulp.dest (PATHS.libsDest))
    .pipe (print (() => {
      // Delete all the lib files inside dist/libs except libs bundle file
      del (PATHS.unwantedLibsSource);
      console.log ("Libs are bundled");
    }));
});

/**
 * Task to minify external JS files. These files are not part of the requirejs
 * module system, so they don't get minified via r.js optimizer.
 * Note: The source here is the `dist` directory because the compilation (by babel)
 * happens before this step and this step just minifies the compiled files.
 */
gulp.task ("minify-ext-js", function () {
  return gulp.src (PATHS.externalJsSrc)
    .pipe (uglify ())
    .pipe (gulp.dest (PATHS.externalJsDest));
});

/**
 * Task to clean unwanted js files after we generate app bundle
 */
gulp.task ("clean-unwanted-js", function () {
  del (PATHS.unwantedAppSource);
});

/**
 * Babel compile JavaScript resources.
 * IMPORTANT - Return stream in order to run this task as a dependency or in
 * sequence.
 */
gulp.task ("scripts", () => {
  return babelCompile (PATHS.scriptsSrc, PATHS.scriptsDestDev, true);
});

/**
 * Local server specific task.
 * Copy the web chat entry point script file to a destination
 */
gulp.task ("copy-webchat", () => {
  return gulp.src (PATHS.webChatSrcDev)
    .pipe (rename ("webChat.js"))
    .pipe (gulp.dest (PATHS.localhostDest));
});

/**
 * Environment specific task.
 * Replace localhost specific template strings with given values
 */
gulp.task ("replace-localhost", function () {
  // Read command line args to get webchat root and api root urls and use them if passed
  // Sample usage is as follows :
  // gulp --webchat http://localsite.helfshift.mobi:port --api http://localsite.helfshift.mobi
  // This allows configuration of local site and api server
  const webChatRoot = gutil.env.webchat ? gutil.env.webchat :
                      "http://localhost:3000";
  const apiRoot = gutil.env.api ? gutil.env.api :
                  "https://api.helpshift.com";

  return gulp.src (PATHS.localhostSource)
      .pipe (replace ("{{TEMPLATES_LIB_PATH}}", TEMPLATE_PATHS.LIBS.DEV, {
        skipBinary: true
      }))
      .pipe (replace ("{{TEMPLATES_APP_PATH}}", TEMPLATE_PATHS.APP.DEV, {
        skipBinary: true
      }))
      .pipe (replace ("{{ENV_WEB_CHAT_ROOT}}", webChatRoot, {
        skipBinary: true
      }))
      .pipe (replace ("{{ENV_API_ROOT}}", apiRoot, {
        skipBinary: true
      }))
      .pipe (gulp.dest (PATHS.localhostDest));
});

/**
 * Watch JavaScript files
 */
gulp.task ("babel:watch", () => {
  babelWatch (PATHS.scriptsSrc, PATHS.scriptsDestDev);
});
