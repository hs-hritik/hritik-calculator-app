const gulp = require("gulp");
const eslint = require("gulp-eslint");
const print = require("gulp-print");
const argv = require("yargs").argv;

const PATHS = {
  eslint: ["static/scripts/**/*.+(js|jsx)", "__tests__/**/*.+(js|jsx)"]
};

/**
 * Runs eslint on js & jsx files
 * You can run eslint on specific file(s) using -
 * gulp eslint --file static/js/pages/admin.js --file static/jsx/widgets/popOver.jsx
 */
const eslintTask = (done) => {
  let src = PATHS.eslint;
  if (argv.file) {
    src = argv.file;
    if (!Array.isArray(src)) {
      src = [src];
    }
    src = src.map((path) => {
      if (path.indexOf("resources/") !== -1) {
        return path.split("resources/")[1];
      }
      return path;
    });
  }

  return gulp
    .src(src)
    .pipe(eslint())
    .pipe(eslint.format(argv.format)) // stylish, compact
    .pipe(eslint.failAfterError())
    .on("error", (error) => {
      done(error);
      process.exit(1);
    })
    .pipe(print((filepath) => `Verified: ${filepath}`));
};

exports.eslint = eslintTask;
