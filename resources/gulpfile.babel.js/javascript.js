const gulp = require("gulp");
const babel = require("gulp-babel");
const rename = require("gulp-rename");
const print = require("gulp-print");
const notifier = require("node-notifier");
const {getTimeStamp} = require("./utils");
const gutil = require("gulp-util");
const replace = require("gulp-replace");
const concat = require("gulp-concat");
const del = require("del");
const gulpSri = require("gulp-sri");
const fs = require("fs");
const uglify = require("gulp-uglify");
const cache = require("gulp-cached");
const gulpIf = require("gulp-if");

/**
 * Maximum hashes to add to the integrity attribute of script tag.
 * Ideally, there should be only one app and min bundle each in production but
 * in case of deployments there might be two to three versions of a bundle temporarily.
 * In this case, the client may request any of these versions, which would fail
 * the SRI integrity check. Hence, we need to keep three hashes for checking the integrity.
 */
const MAX_SRI_LIMIT_PER_INTEGRITY_ATTRIBUTE = 3;

/**
 * Maximum number of SRIs to maintain corresponding to a single resource in hs-sri.json.
 * If a new SRI is generated for a newer version of a resource and max SRI limit
 * per resource is reached then it pops the oldest SRI and prepends the latest SRI.
 */
const MAX_SRI_LIMIT_PER_RESOURCE = 10;

/**
 * Web Chat version
 */
const WEB_CHAT_VERSION = "2.48.0";

/**
 * Name of app bundle
 */
const APP_BUNDLE_NAME = "app";

/**
 * Name of library bundle
 */
const LIBS_BUNDLE_NAME = "libs";

const PATHS = {
  scriptsSrc: "static/scripts/**/*.+(js|jsx)",
  scriptsDest: "dist/scripts",
  scriptsDestDev: "localhost/scripts",

  libsSrc: "static/libs/**/*.js",
  libsDest: "dist/libs",
  libsDestDev: "localhost/libs/",

  // Env specific paths
  ec2Source: ["dist/ec2/**/*.*", "!dist/ec2/fonts/**/*.*"],
  ec2Dest: "dist/ec2/",
  azureSource: ["dist/azure/**/*.*", "!dist/azure/fonts/**/*.*"],
  azureDest: "dist/azure/",
  localshivaSource: ["dist/localshiva/**/*.*", "!dist/localshiva/fonts/**/*.*"],
  localshivaDest: "dist/localshiva/",
  localhostSource: ["localhost/**/*.*", "!localhost/fonts/**/*.*"],
  localhostDest: "localhost/",

  // Specific paths to run the local server
  webChatSrcDev: "localhost/scripts/external/messenger.js",

  // Library bundle specific path
  // @NOTE - Any new file added to libs folder will not be automatically minified
  // You will have to add it explicity to following array.
  bundleLibsSource: [
    "static/libs/react-min.js",
    "static/libs/react-pure-render-mixin-fake.js",
    "static/libs/react-dom-min.js",
    "static/libs/react-addons-update-min.js",
    "static/libs/prop-types-min.js",
    "static/libs/create-react-class-min.js",
    "static/libs/redux-min.js",
    "static/libs/react-redux-min.js",
    "static/libs/require-min.js"
  ],

  // This is the source of files to be removed once libs bundle is generated
  // Basically remove all the file inside dist/libs except for libs-min.js
  unwantedLibsSource: ["dist/libs/**/*", `!dist/libs/${LIBS_BUNDLE_NAME}-min.js`],

  // App bundle specific path
  unwantedAppSource: [
    "dist/scripts/**/*",
    `!dist/scripts/${APP_BUNDLE_NAME}-min.js`,
    `!dist/scripts/${APP_BUNDLE_NAME}-min.js.map`,
    "!dist/scripts/external/**"
  ],

  // SRI related paths
  requirePath: {
    hsSri: "../hs-sri.json",
    tempSri: "../sri.json"
  },

  hsSri: "./hs-sri.json",
  tempSri: "./sri.json",

  // Environment specific SRI related paths
  sri: {
    ec2: {
      source: {
        app: "dist/ec2/scripts/app-min.js",
        libs: "dist/ec2/libs/libs-min.js"
      },
      dest: "dist/ec2/html/index.html"
    },
    azure: {
      source: {
        app: "dist/azure/scripts/app-min.js",
        libs: "dist/azure/libs/libs-min.js"
      },
      dest: "dist/azure/html/index.html"
    },
    localshiva: {
      source: {
        app: "dist/localshiva/scripts/app-min.js",
        libs: "dist/localshiva/libs/libs-min.js"
      },
      dest: "dist/localshiva/html/index.html"
    }
  },

  externalJsSrc: "dist/scripts/external/*.js",
  externalJsDest: "dist/scripts/external/"
};

/**
 * Paths used in templating
 * @TODO: Enable SRI for Azure - Use the same PROD path for LIBS and APP for Azure
 * as for EC2. Move the template strings up, set it to PROD directly and use it (the
 * same value) for EC2, Azure, and localshiva in the "update-xxx-sri" tasks.
 * Currently there are different prod paths for EC2 and Azure because we don't support
 * SRI in Azure. We support SRI for localshiva (sandbox envs), so it's using the
 * EC2 paths.
 */
const TEMPLATE_PATHS = {
  LIBS: {
    DEV: `
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/axios.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/react.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/react-pure-render-mixin-fake.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/react-dom.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/react-addons-update.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/prop-types.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/create-react-class.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/redux.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/react-redux.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/require.js"></script>
    <script src="{{ENV_WEB_CHAT_ROOT}}/scripts/requireConfig.js"></script>
    `,
    PROD: {
      EC2: `<script src="{{ENV_WEB_CHAT_ROOT}}/libs/libs-min.js?v=${WEB_CHAT_VERSION}" \
integrity="{{LIBS_BUNDLE_HASH}}" crossorigin="anonymous"></script>`,
      AZURE: `<script src="{{ENV_WEB_CHAT_ROOT}}/libs/libs-min.js?v=${WEB_CHAT_VERSION}"\
></script>`
    }
  },
  APP: {
    DEV: '<script src="{{ENV_WEB_CHAT_ROOT}}/scripts/pages/webSdk.js"></script>',
    PROD: {
      EC2: `<script src="{{ENV_WEB_CHAT_ROOT}}/scripts/app-min.js?v=${WEB_CHAT_VERSION}" \
integrity="{{APP_BUNDLE_HASH}}" crossorigin="anonymous"></script>`,
      AZURE: `<script src="{{ENV_WEB_CHAT_ROOT}}/scripts/app-min.js?v=${WEB_CHAT_VERSION}"\
></script>`
    }
  }
};

/**
 * Run babel on a given source folder
 * @param {string} srcFolder - Source directory to compile
 * @param {string} destFolder - Destination directory to write to
 * @param {Object} config
 * @param {boolean} config.isProduction - Whether the task is called in production.
 * @param {function} done - Callback to signal async task completion
 * @returns {Object} - Stream of files
 */
const babelCompile = (srcFolder, destFolder, config, done) =>
  gulp
    .src(srcFolder)
    .pipe(gulpIf(!config.isProduction, cache("babelKey")))
    .pipe(
      babel().on("error", (error) => {
        if (!config.isProduction) {
          notifier.notify("Oops! Babel compile error!");
        }

        gutil.log(error);
        done(error);
      })
    )
    .pipe(gulp.dest(destFolder))
    .pipe(print((filepath) => `Compiled: ${filepath} ${getTimeStamp()}`));

/**
 * Watch a given JavaScript source folder
 * @param {string} srcFolder - Source directory to watch
 * @param {string} destFolder - Destination directory to write to
 */
const babelWatch = (srcFolder, destFolder) => {
  gulp.watch(
    srcFolder,
    {ignoreInitial: true},
    gulp.series(replaceLocalhostTask, copyWebchatTask, (done) =>
      babelCompile(srcFolder, destFolder, {isProduction: false}, done)
    )
  );
};

/**
 * Compiles/watches js/jsx files. Only meant for production.
 */
const compileScriptsProdTask = (done) =>
  babelCompile(PATHS.scriptsSrc, PATHS.scriptsDest, {isProduction: true}, done);

/**
 * Returns a string by combining the latest three SRI hashes corresponding
 * to a given path from the hs-sri.json file.
 * @param {String} path - bundle path from the dist directory
 * @returns {String} A string of latest three hashes.
 */
const getBundleHash = (path) => {
  const hsSri = require(PATHS.requirePath.hsSri);
  return hsSri[path].slice(0, MAX_SRI_LIMIT_PER_INTEGRITY_ATTRIBUTE).join(" ");
};

/**
 * Production task.
 * Replace EC2 specific template strings with given values
 */
const buildEc2Task = () =>
  gulp
    .src(PATHS.ec2Source)
    .pipe(
      replace("{{TEMPLATES_LIB_PATH}}", TEMPLATE_PATHS.LIBS.PROD.EC2, {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{TEMPLATES_APP_PATH}}", TEMPLATE_PATHS.APP.PROD.EC2, {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{ENV_WEB_CHAT_ROOT}}", "https://webchat.helpshift.com", {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{ENV_API_ROOT}}", "https://api.helpshift.com", {
        skipBinary: true
      })
    )
    .pipe(gulp.dest(PATHS.ec2Dest));

/**
 * Production task.
 * Replace Azure specific template strings with given values
 */
const buildAzureTask = () =>
  gulp
    .src(PATHS.azureSource)
    .pipe(
      replace("{{TEMPLATES_LIB_PATH}}", TEMPLATE_PATHS.LIBS.PROD.AZURE, {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{TEMPLATES_APP_PATH}}", TEMPLATE_PATHS.APP.PROD.AZURE, {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{ENV_WEB_CHAT_ROOT}}", "https://webchat-a.helpshift.com", {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{ENV_API_ROOT}}", "https://api-a.helpshift.com", {
        skipBinary: true
      })
    )
    .pipe(gulp.dest(PATHS.azureDest));

/**
 * Production task.
 * Replace localshiva (staging) specific template strings with given values
 */
const buildLocalshivaTask = () =>
  gulp
    .src(PATHS.localshivaSource)
    .pipe(
      replace("{{TEMPLATES_LIB_PATH}}", TEMPLATE_PATHS.LIBS.PROD.EC2, {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{TEMPLATES_APP_PATH}}", TEMPLATE_PATHS.APP.PROD.EC2, {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{ENV_WEB_CHAT_ROOT}}", "https://webchat.helpshift.mobi", {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{ENV_API_ROOT}}", "https://api.helpshift.mobi", {
        skipBinary: true
      })
    )
    .pipe(gulp.dest(PATHS.localshivaDest));

/**
 * Copy libs from source dir (workspace) to destination dir (server)
 */
const libsTask = () => gulp.src(PATHS.libsSrc).pipe(gulp.dest(PATHS.libsDestDev));

/**
 * Task to combine given libs in single bundle file
 */
const bundleLibsTask = () =>
  gulp
    .src(PATHS.bundleLibsSource)
    .pipe(concat(`${LIBS_BUNDLE_NAME}-min.js`))
    .pipe(gulp.dest(PATHS.libsDest))
    .pipe(
      print(() => {
        // Delete all the lib files inside dist/libs except libs bundle file
        del(PATHS.unwantedLibsSource);
        return "Libs are bundled";
      })
    );

/**
 * Task to minify external JS files. These files are not part of the requirejs
 * module system, so they don't get minified via r.js optimizer.
 * Note: The source here is the `dist` directory because the compilation (by babel)
 * happens before this step and this step just minifies the compiled files.
 */
const minifyExtJsTask = () =>
  gulp
    .src(PATHS.externalJsSrc)
    .pipe(uglify())
    .pipe(gulp.dest(PATHS.externalJsDest));

/**
 * Task to clean unwanted js files after we generate app bundle
 */
const cleanUnwantedJsTask = () => del(PATHS.unwantedAppSource);

/**
 * Task to generate sri for libs and app JS bundles
 */
const sriTask = () => {
  const {
    sri: {ec2, azure, localshiva}
  } = PATHS;

  const DEST_PATHS = [
    ec2.source.app,
    ec2.source.libs,
    azure.source.app,
    azure.source.libs,
    localshiva.source.app,
    localshiva.source.libs
  ];

  return gulp
    .src(DEST_PATHS)
    .pipe(
      gulpSri({
        algorithms: ["sha512"]
      })
    )
    .pipe(gulp.dest("."))
    .pipe(print(() => "Temporary resources/sri.json file generated"));
};

/**
 * Task to update hs-sri.json file
 * It checks if newly generated hash for bundles matches with the first three
 * hashes of the previous versions of the same bundle, if it does then the
 * latest version is skipped.
 * This is required because we maintain hashes of last 10 versions corresponding to a file.
 * But we only add first three versions to the integrity attribute (check getBundleHash function)
 */
const updateSriListTask = (done) => {
  const hsSri = require(PATHS.requirePath.hsSri);
  const sri = require(PATHS.requirePath.tempSri);

  Object.keys(sri).forEach((key) => {
    // If new bundle is added then it won't be present
    // in hs-sri.json file. So, create a key corresponding
    // to that file and associate it to empty array.
    if (!Array.isArray(hsSri[key])) {
      hsSri[key] = [];
    }

    // If the sri hash value is present with in first three hash values
    // then don't add this value otherwise add it.
    if (hsSri[key].slice(0, MAX_SRI_LIMIT_PER_INTEGRITY_ATTRIBUTE).indexOf(sri[key]) !== -1) {
      return;
    }

    // Pop the last value if max limit has reached
    if (hsSri[key].length === MAX_SRI_LIMIT_PER_RESOURCE) {
      hsSri[key].pop();
    }

    // Prepend the latest hash value in the array
    hsSri[key].unshift(sri[key]);
  });

  // Write the changes to hs-sri.json file
  const writeStream = fs.createWriteStream(PATHS.hsSri);
  writeStream.write(JSON.stringify(hsSri), (err) => {
    if (err) {
      return done(err);
    }

    // Delete sri.json temp file
    fs.unlink(PATHS.tempSri, done);
  });
};

const updateEc2SriTask = () =>
  gulp
    .src(PATHS.sri.ec2.dest)
    .pipe(
      replace("{{LIBS_BUNDLE_HASH}}", getBundleHash(PATHS.sri.ec2.source.libs), {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{APP_BUNDLE_HASH}}", getBundleHash(PATHS.sri.ec2.source.app), {
        skipBinary: true
      })
    )
    .pipe(gulp.dest("dist/ec2/html/"));

const updateAzureSriTask = () =>
  gulp
    .src(PATHS.sri.azure.dest)
    .pipe(
      replace("{{LIBS_BUNDLE_HASH}}", getBundleHash(PATHS.sri.azure.source.libs), {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{APP_BUNDLE_HASH}}", getBundleHash(PATHS.sri.azure.source.app), {
        skipBinary: true
      })
    )
    .pipe(gulp.dest("dist/azure/html/"));

const updateLocalshivaSriTask = () =>
  gulp
    .src(PATHS.sri.localshiva.dest)
    .pipe(
      replace("{{LIBS_BUNDLE_HASH}}", getBundleHash(PATHS.sri.localshiva.source.libs), {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{APP_BUNDLE_HASH}}", getBundleHash(PATHS.sri.localshiva.source.app), {
        skipBinary: true
      })
    )
    .pipe(gulp.dest("dist/localshiva/html/"));

/**
 * Babel compile JavaScript resources.
 * IMPORTANT - Return stream in order to run this task as a dependency or in
 * sequence.
 */
const compileScriptsDevTask = (done) =>
  babelCompile(PATHS.scriptsSrc, PATHS.scriptsDestDev, {isProduction: false}, done);

/**
 * Local server specific task.
 * Copy the web chat entry point script file to a destination
 */
const copyWebchatTask = () =>
  gulp
    .src(PATHS.webChatSrcDev)
    .pipe(rename("webChat.js"))
    .pipe(gulp.dest(PATHS.localhostDest));

/**
 * Environment specific task.
 * Replace localhost specific template strings with given values
 */
const replaceLocalhostTask = () => {
  // Read command line args to get webchat root and api root urls and use them if passed
  // Sample usage is as follows :
  // npm run gulp -- --webchat http://localsite.helfshift.mobi:port
  // npm run gulp -- --api https://api.helpshift.mobi
  // This allows configuration of local site and api server
  const webChatRoot = gutil.env.webchat ? gutil.env.webchat : "http://localhost:3000";
  const apiRoot = gutil.env.api ? gutil.env.api : "https://api.helpshift.com";

  return gulp
    .src(PATHS.localhostSource)
    .pipe(
      replace("{{TEMPLATES_LIB_PATH}}", TEMPLATE_PATHS.LIBS.DEV, {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{TEMPLATES_APP_PATH}}", TEMPLATE_PATHS.APP.DEV, {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{ENV_WEB_CHAT_ROOT}}", webChatRoot, {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{ENV_API_ROOT}}", apiRoot, {
        skipBinary: true
      })
    )
    .pipe(gulp.dest(PATHS.localhostDest));
};

/**
 * Watch JavaScript files
 */
const babelWatchTask = () => {
  babelWatch(PATHS.scriptsSrc, PATHS.scriptsDestDev);
};

exports.compileScriptsDev = compileScriptsDevTask;
exports.replaceLocalhost = replaceLocalhostTask;
exports.babelWatch = babelWatchTask;
exports.copyWebchat = copyWebchatTask;
exports.sri = sriTask;
exports.cleanUnwantedJs = cleanUnwantedJsTask;
exports.minifyExtJs = minifyExtJsTask;
exports.updateLocalshivaSri = updateLocalshivaSriTask;
exports.updateAzureSri = updateAzureSriTask;
exports.updateEc2Sri = updateEc2SriTask;
exports.updateSriList = updateSriListTask;
exports.bundleLibs = bundleLibsTask;
exports.buildLocalshiva = buildLocalshivaTask;
exports.buildAzure = buildAzureTask;
exports.compileScriptsProd = compileScriptsProdTask;
exports.buildEc2 = buildEc2Task;
exports.libs = libsTask;
