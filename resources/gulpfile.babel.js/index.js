/**
 * gulpfile for moby build tasks.
 *
 * @Contributor Prajwalit Bhopale <prajwalit@helpshift.com>
 */

const gulp = require("gulp");
const {
  compileScriptsDev,
  replaceLocalhost,
  babelWatch,
  copyWebchat,
  sri,
  cleanUnwantedJs,
  minifyExtJs,
  updateLocalshivaSri,
  updateAzureSri,
  updateEc2Sri,
  updateSriList,
  bundleLibs,
  buildLocalshiva,
  buildAzure,
  compileScriptsProd,
  buildEc2,
  libs
} = require("./javascript");
const {eslint} = require("./lint");
const {sassCompileDev, sassCompileProd, sassWatch, sassLint} = require("./sass");
const {icons} = require("./icons");

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
const ls = (done) => {
  console.log(`\

    NOTE - [Production] denotes that the task runs for production builds and should be
    updated with caution.

    Common Tasks
      watch             - Build and watch for HTML, SCSS, and JS changes
      build-localhost   - Build files for local development

    JS Tasks
      babel             - [Production] Compile JS
      scripts           - Compile JS
      babel:watch       - Watch for JS changes
      build-ec2         - [Production] Replace EC2 specific template strings
      build-azure       - [Production] Replace Azure specific template strings
      build-localshiva  - [Production] Replace staging specific template strings
      replace-localhost - Replace local env specific template strings
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

  done();
};

/**
 * Copy HTML files from source dir (workspace) to destination dir (server)
 */
const htmlTask = () => gulp.src(PATHS.htmlSrc).pipe(gulp.dest(PATHS.localhostDest));

/**
 * Watch HTML files
 */
const htmlWatchTask = () => {
  gulp.watch(PATHS.htmlSrc, () => {
    gulp.series(htmlTask, replaceLocalhost, copyDemoTask);
  });
};

/**
 * Copy font files from source dir (workspace) to destination dir (server)
 */
const fontsTask = () => gulp.src(PATHS.fontsSrc).pipe(gulp.dest(PATHS.fontsDest));

/**
 * Copy assets from source dir (workspace) to destination dir (server)
 */
const assetsTask = () => gulp.src(PATHS.assetsSrc).pipe(gulp.dest(PATHS.assetsDest));

/**
 * Local server specific task.
 * Copy the demo entry point HTML to a destination
 */
const copyDemoTask = () => gulp.src(PATHS.demoSrc).pipe(gulp.dest(PATHS.demoDest));

/**
 * Combined tasks to prepare resources for local development
 */
const buildLocalhostTask = gulp.series(
  htmlTask,
  sassCompileDev,
  libs,
  fontsTask,
  assetsTask,
  compileScriptsDev,
  replaceLocalhost,
  copyWebchat,
  copyDemoTask
);

/**
 * Combined tasks for generating sri for JS bundles and updating
 * the hs-sri.json file.
 *
 * @NOTE: We are not generating SRI for Azure right now. This is because our Azure
 * CDN account doesn't support caching based on request headers which is required
 * for loading CORS requests.
 * More details can be found at https://helpshift.atlassian.net/browse/ONCALL-4197
 *
 * @TODO: Enable SRI for Azure - In order to enable SRI for Azure add
 * "update-azure-sri" task here. Like -
 * runSequence ("sri", "update-sri-list", "update-ec2-sri", "update-azure-sri",
 *   "update-localshiva-sri");
 */
const generateSriTask = gulp.series(sri, updateSriList, updateEc2Sri, updateLocalshivaSri);
const watchTask = gulp.series(
  buildLocalhostTask,
  gulp.parallel(babelWatch, htmlWatchTask, sassWatch)
);

// Common tasks
exports.ls = ls;
exports.watch = watchTask;
exports["build-localhost"] = buildLocalhostTask;

// JS tasks
exports.babel = compileScriptsProd;
exports.scripts = compileScriptsDev;
exports["babel:watch"] = babelWatch;
exports["build-ec2"] = buildEc2;
exports["build-azure"] = buildAzure;
exports["build-localshiva"] = buildLocalshiva;
exports["replace-localhost"] = replaceLocalhost;
exports["bundle-libs"] = bundleLibs;
exports.libs = libs;
exports["copy-webchat"] = copyWebchat;

// CSS tasks
exports["sass:compile"] = sassCompileProd;
exports["sass:styles"] = sassCompileDev;
exports["sass:watch"] = sassWatch;
exports["sass:lint"] = sassLint;

exports.html = htmlTask;
exports.htmlWatch = htmlWatchTask;
exports.fonts = fontsTask;
exports["copy-demo"] = copyDemoTask;

exports.sri = sri;
exports["clean-unwanted-js"] = cleanUnwantedJs;
exports["minify-ext-js"] = minifyExtJs;
exports["update-localshiva-sri"] = updateLocalshivaSri;
exports["update-azure-sri"] = updateAzureSri;
exports["update-ec2-sri"] = updateEc2Sri;
exports["update-sri-list"] = updateSriList;
exports.assets = assetsTask;
exports["generate-sri"] = generateSriTask;

exports.eslint = eslint;
exports.icons = icons;

exports.default = watchTask;
exports.lint = gulp.parallel(sassLint, eslint);
