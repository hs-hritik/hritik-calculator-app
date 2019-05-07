/* eslint-disable strict, no-console  */
const gulp = require ("gulp");
const sass = require ("gulp-sass");
const gulpStylelint = require ("gulp-stylelint");
const gutil = require ("gulp-util");
const plumber = require ("gulp-plumber");
const sourcemaps = require ("gulp-sourcemaps");
const autoprefixer = require ("gulp-autoprefixer");
const importOnce = require ("node-sass-import-once");
const cache = require ("gulp-cached");


const PATHS = {
  styles: {
    src: "styles/**/*.scss",
    dest: "dist/css",
    lint: [
      "styles/**/*.scss",
      "!styles/vendor/**/*.scss",
      "!docs/**/*"
    ]
  },
  stylesDev: {
    src: "styles/**/*.scss",
    dest: "localhost/css",
    lint: [
      "styles/**/*.scss",
      "!styles/vendor/**/*.scss",
      "!docs/**/*"
    ]
  }
};

const BROWSER_COMPATIBILITY = [
  "last 5 versions",
  "ie > 9",
  "ios_saf > 8"
];

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
  gutil.log (gutil.colors.blue.bold (
    "*** START: SCSS Lint ***"
  ));

  return gulp.src (path.lint)
    .pipe (cache ("styleLintKey"))
    .pipe (gulpStylelint ({
      failAfterError: isProduction,
      reporters: [
        {formatter: "string", console: true}
      ],
      debug: !isProduction
    }))
    .on ("end", () => {
      gutil.log (gutil.colors.blue.bold (
        "*** END: SCSS Lint ***\n"
      ));
    });
};

/**
 * Compiles sass files into css and run stylelint
 */
const compileSass = (path, prod = false) => {
  let sassHasErrors = false;

  return gulp.src (path.src)
    .pipe (sourcemaps.init ())
    .pipe (plumber ())
    .pipe (sass (prod === true ?
                          SASS_OPTIONS.production : SASS_OPTIONS.development)
                            .on ("error", sass.logError)
                            .on ("error", () => {
                              sassHasErrors = true;
                            }))
    .pipe (autoprefixer ({
      browsers: BROWSER_COMPATIBILITY
    }))
    .pipe (sourcemaps.write ("."))
    .pipe (plumber.stop ())
    .pipe (gulp.dest (path.dest))
    .on ("finish", () => {
      if (!sassHasErrors) {
        lintSass (path, prod);
      }
    });
};


gulp.task ("sass:styles", () => {
  compileSass (PATHS.stylesDev);
});

gulp.task ("sass:compile", () => {
  compileSass (PATHS.styles, true);
});

gulp.task ("sass:watch", ["sass:styles"], () => {
  gulp.watch ([PATHS.stylesDev.src], ["sass:styles"]);
});

gulp.task ("sass:lint", function () {
  return lintSass (PATHS.styles, true);
});
