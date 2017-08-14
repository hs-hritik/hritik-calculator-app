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


const PATHS = {
  scripts    : ["static/scripts/**/*.+(js|jsx)", "!static/scripts/gunpowder/**/*.*"],
  build      : "dist/scripts",
  libsMin    : ["static/libs/*-min.js"],
  libs       : "static/libs",
  uglify     : ["dist/scripts/**/*.js"],
  gunpowderSrc: "static/scripts/gunpowder/node_modules/@helpshiftdev/gunpowder/resources/static/scripts/**/*.+(js|jsx)",
  gunpowderBuild: "dist/scripts/gunpowder"
};


const REACT_URL = "http://fb.me/react-with-addons-{version}{min}.js";


/*
 * Compile jsx files
 */
const babelCompile = function (srcFolder, destFolder, errorGrowl) {
  gulp.src (srcFolder)
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
 * Compile jsx file once and then start watching jsx folder for changes
 */
const babelWatch = function (srcFolder, destFolder, separator = "/scripts/") {
  babelCompile (srcFolder, destFolder);
  gulp.watch (srcFolder, function (event) {
    const filePath = event.path.split ("/resources/") [1];
    let destPath = filePath.split (separator) [1];
    destPath = `${destFolder}/${destPath}`;
    destPath = destPath.replace (/\/.[^\/]*$/, "/");
    babelCompile (filePath, destPath, true);
  });
};


/**
 * Compiles/watches js/jsx files. Also compiles tests
 * if --production or --prod option is not mentioned.
 */
gulp.task ("babel", function () {
  if (argv.production || argv.prod) {
    // Doesn't compile test files.
    babelCompile (PATHS.scripts, PATHS.build);
    babelCompile (PATHS.gunpowderSrc, PATHS.gunpowderBuild);
  } else if (argv.compile) {
    // Compile files from jsx, scripts & tests
    console.log ("Compiling...");
    babelCompile (PATHS.scripts, PATHS.build);
    babelCompile (PATHS.gunpowderSrc, PATHS.gunpowderBuild);
  } else {
    // Watch files from jsx, scripts & tests
    console.log ("Compiling & watching...");
    babelWatch (PATHS.scripts, PATHS.build);
    babelWatch (PATHS.gunpowderSrc, PATHS.gunpowderBuild);
  }
});


/**
 * Goes through all the js files. Compresses them and keeps them in the same spot.
 */
gulp.task ("uglify", function () {
  return gulp.src (PATHS.uglify)
    .pipe (uglify ())
    .pipe (gulp.dest (PATHS.build))
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
  gulp.src (PATHS.libsMin)
    .pipe (rename (function (path) {
      path.basename = path.basename.replace ("-min", "");
      console.log (`Replaced ${path.basename}-min.js with ${path.basename}.js`);
    }))
    .pipe (gulp.dest (PATHS.libs));
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
