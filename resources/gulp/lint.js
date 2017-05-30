/* eslint-disable strict, no-undef */
const gulp = require ("gulp");
const eslint = require ("gulp-eslint");
const print = require ("gulp-print");
const argv = require ("yargs").argv;

const PATHS = {
  eslint: [
    "static/scripts/**/*.+(js|jsx)",
    "static/__tests__/src/**/*.+(js|jsx)"
  ]
};


/**
 * Runs eslint on js & jsx files
 * You can run eslint on specific file(s) using -
 * gulp eslint -f static/js/pages/admin.js -f static/jsx/widgets/popOver.jsx
 */
gulp.task ("eslint", function () {
  let src = PATHS.eslint;
  if (argv.f) {
    src = argv.f;
    if (!Array.isArray (src)) {
      src = [src];
    }
    src = src.map (function (path) {
      if (path.indexOf ("resources/") !== -1) {
        return path.split ("resources/") [1];
      }
      return path;
    });
  }

  gulp.src (src)
          .pipe (eslint ())
          .pipe (eslint.format (argv.format)) // stylish, compact
          .pipe (eslint.failAfterError ())
          .on ("error", function () {
            process.exit (1);
          }).pipe (print (function (filepath) {
            return `Verified: ${filepath}`;
          }));
});
