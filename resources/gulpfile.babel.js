/* eslint-disable strict, no-console */

/**
 * gulpfile for moby build tasks.
 *
 * @Contributor Prajwalit Bhopale <prajwalit@helpshift.com>
 */

const gulp = require ("gulp");
const requireDir = require ("require-dir");
const runSequence = require ("run-sequence");

requireDir ("./gulp");

const PATHS = {
  htmlSrc: "static/**/*.html",
  fontsSrc: "static/fonts/**/*",
  fontsDest: "localhost/fonts/",
  assetsSrc: "static/assets/**/*",
  assetsDest: "localhost/assets",
  // Specific paths to run the local server
  demoSrc: "localhost/html/demo/**/*.html",
  demoDest: "localhost/demo/",
  localhostDest: "localhost/"
};

/**
 * Lists all the possible commands
 */
gulp.task ("ls", function () {
  console.log (`\

    NOTE - [Production] denotes that the task runs for production builds and should be
    updated with caution.

    Common Tasks
      watch             - Build and watch for HTML, SCSS, and JS changes
      build-localhost   - Build files for local development

    JS Tasks
      babel             - [Production] Compile JS
      scripts           - Compile JS
      babel:watch       - Watch for JS changes
      uglify            - [Production] Uglify JS
      overwrite-min     - [Production] Replace debug version of lib files to minified ones
      build-ec2         - [Production] Replace EC2 specific template strings
      build-azure       - [Production] Replace Azure specific template strings
      build-localshiva  - [Production] Replace staging specific template strings
      replace-localhost - Replace local env specific template strings
      bundle-js         - Bundles app's js files
      bundle-libs       - Bundles library files
      libs              - Copy library files to the server directory
      copy-webchat      - Copy web chat entry script to the server directory

    CSS Tasks
      sass:compile      - [Production] Compile SCSS
      sass:styles       - Compile SCSS
      sass:watch        - Watch for SCSS changes
      sass:lint         - [Production] Lint SCSS

    Other Tasks
      html              - Copy HTML files to the server directory
      html:watch        - Watch for HTML changes
      fonts             - Copy font files to the server directory
      copy-demo         - Copy the demo entry point HTML to the server directory
  `);
});

/**
 * Copy HTML files from source dir (workspace) to destination dir (server)
 */
gulp.task ("html", () => {
  return gulp.src (PATHS.htmlSrc)
    .pipe (gulp.dest (PATHS.localhostDest));
});

/**
 * Watch HTML files
 */
gulp.task ("html:watch", () => {
  gulp.watch (PATHS.htmlSrc, () => {
    runSequence ("html", "replace-localhost", "copy-demo");
  });
});

/**
 * Copy font files from source dir (workspace) to destination dir (server)
 */
gulp.task ("fonts", () => {
  return gulp.src (PATHS.fontsSrc)
    .pipe (gulp.dest (PATHS.fontsDest));
});

/**
 * Copy assets from source dir (workspace) to destination dir (server)
 */
gulp.task ("assets", () => {
  return gulp.src (PATHS.assetsSrc)
    .pipe (gulp.dest (PATHS.assetsDest));
});

/**
 * Local server specific task.
 * Copy the demo entry point HTML to a destination
 */
gulp.task ("copy-demo", () => {
  return gulp.src (PATHS.demoSrc)
    .pipe (gulp.dest (PATHS.demoDest));
});

/**
 * Combined tasks to prepare resources for local development
 */
gulp.task ("build-localhost", function () {
  console.log ("Preparing resources for local env");
  runSequence ("html", "sass:styles", "libs", "fonts", "assets", "scripts",
    "replace-localhost", "copy-webchat", "copy-demo");
});

gulp.task ("watch", ["build-localhost", "babel:watch", "html:watch", "sass:watch"]);
gulp.task ("default", ["watch"]);
gulp.task ("lint", ["lint:sass", "eslint"]);
