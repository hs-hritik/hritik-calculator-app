/* eslint-disable strict, no-console */

const gulp = require ("gulp");
const babel = require ("gulp-babel");
const rename = require ("gulp-rename");
const uglify = require ("gulp-uglify");
const download = require ("gulp-download");
const print = require ("gulp-print");
const notifier = require ("node-notifier");
const {argv} = require ("yargs");
const {getTimeStamp} = require ("./utils");
const gutil = require ("gulp-util");
const replace = require ("gulp-replace");
const runSequence = require ("run-sequence");

const PATHS = {
  scriptsSrc: "static/scripts/**/*.+(js|jsx)",
  scriptsDest: "dist/scripts",
  scriptsDestDev: "localhost/scripts",

  libsSrc: "static/libs/**/*.js",
  libsDestDev: "localhost/libs/",
  libsMinSrc: "static/libs/*-min.js",
  libs: "static/libs",

  uglify: "dist/scripts/**/*.js",

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
  webChatSrcDev: "localhost/scripts/external/messenger.js"
};

const REACT_URL = "http://fb.me/react-with-addons-{version}{min}.js";

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
 * Goes through all the js files. Compresses them and keeps them in the same spot.
 */
gulp.task ("uglify", function () {
  return gulp.src (PATHS.uglify)
    .pipe (uglify ())
    .pipe (gulp.dest (PATHS.scriptsDest))
    .pipe (print (function (filepath) {
      return `Uglified: ${filepath}`;
    }));
});

/**
 * Overwrites minified libs.
 * If there's a file in /libs/ folder with name say foo-min.js,
 * this task overwrites foo.js with foo-min.js
 * This is used to replace dev version of react with prod version
 */
gulp.task ("overwrite-min", function () {
  gulp.src (PATHS.libsMinSrc)
    .pipe (rename (function (path) {
      path.basename = path.basename.replace ("-min", "");
      console.log (`Replaced ${path.basename}-min.js with ${path.basename}.js`);
    }))
    .pipe (gulp.dest (PATHS.libs));
});

/**
 * Production task.
 * Replace EC2 specific template strings with given values
 */
gulp.task ("build-ec2", function () {
  gulp.src (PATHS.ec2Source)
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
      .pipe (replace ("{{ENV_WEB_CHAT_ROOT}}", "https://webchat.helpshift.mobi", {
        skipBinary: true
      }))
      .pipe (replace ("{{ENV_API_ROOT}}", "https://api.helpshift.mobi", {
        skipBinary: true
      }))
      .pipe (gulp.dest (PATHS.localshivaDest));
});

/**
 * Task to update react library with the latest version.
 * (For lazy people)
 */
gulp.task ("update-react", function () {
  const version = argv.version;

  if (!version) {
    console.log ("Please enter React version");
    return;
  }
  const url = REACT_URL.replace ("{version}", version);

  download (url.replace ("{min}", ""))
               .pipe (rename ("react-with-addons.js"))
               .pipe (gulp.dest (PATHS.libs));

  download (url.replace ("{min}", ".min"))
               .pipe (rename ("react-with-addons-min.js"))
               .pipe (gulp.dest (PATHS.libs));
});

/**
 * Copy libs from source dir (workspace) to destination dir (server)
 */
gulp.task ("libs", () => {
  return gulp.src (PATHS.libsSrc)
    .pipe (gulp.dest (PATHS.libsDestDev));
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
  return gulp.src (PATHS.localhostSource)
      .pipe (replace ("{{ENV_WEB_CHAT_ROOT}}", "http://localhost:3000", {
        skipBinary: true
      }))
      .pipe (replace ("{{ENV_API_ROOT}}", "https://api.helpshift.com", {
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
