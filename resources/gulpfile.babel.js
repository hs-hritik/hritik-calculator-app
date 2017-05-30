/* eslint-disable strict, no-console */

/**
 * gulpfile for moby build tasks.
 *
 * @Contributor Prajwalit Bhopale <prajwalit@helpshift.com>
 */

const gulp = require ("gulp");
const requireDir = require ("require-dir");

requireDir ("./gulp");


/**
 * Make sure you update package.json if you add a new dependency.
 */


/**
 * Lists all the possible commands
 */
gulp.task ("ls", function () {
  console.log ("\nJS tasks:");
  console.log ("---------");
  console.log ("  watch = (babel + sass:watch) [DEFAULT]");
  console.log ("  jsx");
  console.log ("  babel");
  console.log ("  uglify");
  console.log ("  eslint");
  console.log ("  overwrite-min");
  console.log ("  update-react");
  console.log ("\n\nSass tasks:");
  console.log ("-------------");
  console.log ("  sass:watch");
  console.log ("  sass:compile");
  console.log ("  sass:docs");
  console.log ("  sass:audit");
  console.log ("  sass:lint");
  console.log ("  icons");
  console.log ("\n");
});


/**
 * Compiles/watches js/jsx files in static/scripts folder
 */
gulp.task ("jsx", ["babel"]);
gulp.task ("watch", ["babel", "sass:watch"]);
gulp.task ("default", ["watch"]);
gulp.task ("lint", ["lint:sass", "eslint"]);
