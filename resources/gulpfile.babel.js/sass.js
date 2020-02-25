const gulp = require("gulp");
const sass = require("gulp-sass");
const gulpStylelint = require("gulp-stylelint");
const gutil = require("gulp-util");
const plumber = require("gulp-plumber");
const gulpIf = require("gulp-if");
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("gulp-autoprefixer");
const importOnce = require("node-sass-import-once");
const cache = require("gulp-cached");
const notifier = require("node-notifier");
const print = require("gulp-print");

const PATHS = {
  styles: {
    src: "styles/**/*.scss",
    dest: "dist/css",
    lint: ["styles/**/*.scss", "!styles/vendor/**/*.scss", "!docs/**/*", "!styles/hestia/**/*"]
  },
  stylesDev: {
    src: "styles/**/*.scss",
    dest: "localhost/css",
    lint: ["styles/**/*.scss", "!styles/vendor/**/*.scss", "!docs/**/*", "!styles/hestia/**/*"]
  }
};

// @TODO: Check if we want to use common browserslist for babel
const BROWSER_COMPATIBILITY = ["last 5 versions", "ie > 9", "ios_saf > 8"];

const SASS_OPTIONS = {
  development: {
    outputStyle: "expanded",
    importer: importOnce,
    importOnce: {
      index: false
    }
  },
  production: {
    errLogToConsole: true,
    outputStyle: "compressed",
    importer: importOnce,
    importOnce: {
      index: false
    }
  }
};

/**
 * Function to run stylelint
 * @param {string} path - Path of the directory which has scss files
 * @param {boolean} isProduction - Whether the environment is production
 */
const lintSass = (path, isProduction) => {
  gutil.log(gutil.colors.blue.bold("*** START: SCSS Lint ***"));

  return gulp
    .src(path.lint)
    .pipe(gulpIf(!isProduction, cache("styleLintKey")))
    .pipe(
      gulpStylelint({
        failAfterError: isProduction,
        reporters: [{formatter: "string", console: true}],
        debug: !isProduction
      })
    )
    .pipe(print((filepath) => `Linted: ${filepath}`))
    .on("end", () => {
      gutil.log(gutil.colors.blue.bold("*** END: SCSS Lint ***\n"));
    });
};

/**
 * Compiles sass files into css and run stylelint
 */
const compileSass = (path, prod, done) =>
  gulp
    .src(path.src)
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(
      sass(prod === true ? SASS_OPTIONS.production : SASS_OPTIONS.development).on("error", function(
        error
      ) {
        if (!prod) {
          notifier.notify("Oops! Sass compile error!");
        }

        sass.logError.call(this, error);
        done(error);
      })
    )
    .pipe(
      autoprefixer({
        browsers: BROWSER_COMPATIBILITY
      })
    )
    .pipe(sourcemaps.write("."))
    .pipe(plumber.stop())
    .pipe(gulp.dest(path.dest))
    .pipe(print((filepath) => `Compiled: ${filepath}`));

const sassCompileDevTask = (done) => compileSass(PATHS.stylesDev, false, done);

const sassCompileProdTask = (done) => compileSass(PATHS.styles, true, done);

const sassLintDevTask = () => lintSass(PATHS.styles, false);

const sassLintProdTask = () => lintSass(PATHS.styles, true);

const sassWatch = () => {
  gulp.watch(
    PATHS.stylesDev.src,
    {ignoreInitial: false},
    gulp.parallel(sassCompileDevTask, sassLintDevTask)
  );
};

exports.sassCompileDev = gulp.parallel(sassCompileDevTask, sassLintDevTask);
exports.sassCompileProd = gulp.series(sassLintProdTask, sassCompileProdTask);
exports.sassWatch = sassWatch;
exports.sassLint = sassLintProdTask;
