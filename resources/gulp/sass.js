/* eslint-disable strict, no-undef, no-console, no-unused-expressions  */
const fs = require ("fs");
const gulp = require ("gulp");
const sass = require ("gulp-sass");
const gutil = require ("gulp-util");
const plumber = require ("gulp-plumber");
const sourcemaps = require ("gulp-sourcemaps");
const autoprefixer = require ("gulp-autoprefixer");
const scssLint = require ("gulp-scss-lint");
const importOnce = require ("node-sass-import-once");
const cache = require ("gulp-cached");
const Parker = require ("parker/lib/Parker");
const prettyJSON = require ("prettyjson");


const PATHS = {
  styles: {
    src: "styles/**/*.scss",
    dest: "dist/css",
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
 * Function to run scss-lint
 */

const lintSassDev = (path) => {
  gutil.log (gutil.colors.blue.bold (
    "*** START: SCSS Lint ***"
  ));

  return gulp.src (path.lint)
             .pipe (cache ("scssLint"))
             .pipe (scssLint ({
               bundleExec: true,
               config: ".scss-lint.yml"
             }))
             .on ("end", () => {
               gutil.log (gutil.colors.blue.bold (
                 "*** END: SCSS Lint ***\n"
               ));
             });
};

const lintSassProd = (path) => {
  gutil.log (gutil.colors.blue.bold (
    "*** START: SCSS Lint ***"
  ));

  return gulp.src (path.lint)
             .pipe (cache ("scssLint"))
             .pipe (scssLint ({
               bundleExec: true,
               config: ".scss-lint.yml"
             }))
             .on ("end", () => {
               gutil.log (gutil.colors.blue.bold (
                 "*** END: SCSS Lint ***\n"
               ));
             })
             .pipe (scssLint.failReporter ("E"));
};

/**
 * Compiles sass files into css and run scss-lint
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
                 (prod === true) ? lintSassProd (path) : lintSassDev (path);
               }
             });
};


gulp.task ("sass:styles", () => {
  compileSass (PATHS.styles);
});

gulp.task ("sass:compile", () => {
  compileSass (PATHS.styles, true);
});

gulp.task ("sass:watch", ["sass:styles"], () => {
  gulp.watch ([PATHS.styles.src], ["sass:styles"]);
});

gulp.task ("sass:lint", function () {
  return lintSassProd (PATHS.styles, true);
});


gulp.task ("sass:audit", ["sass:compile"], (cb) => {
  fs.readFile ("./static/css/style.css", function (err, data) {
    const parker = new Parker (require ("parker/metrics/All"));
    const results = parker.run (data.toString ());
    console.log (prettyJSON.render (results));
    cb ();
  });
});
