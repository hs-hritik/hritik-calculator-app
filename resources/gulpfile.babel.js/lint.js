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
  const gulpSrcOptions = {};
  let src = PATHS.eslint;

  if (argv.file) {
    src = argv.file;
    // The argument --file is passed by office bots to run eslint on changed files.
    // When eslint task is ran on JS diff, that diff may include deleted files, but eslint task
    // will fail on non existent files. So we added allowEmpty flag to make it pass as a temporary
    // workaround
    gulpSrcOptions.allowEmpty = true;

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
    .src(src, gulpSrcOptions)
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
