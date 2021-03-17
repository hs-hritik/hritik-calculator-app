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
const path = require("path");

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
const WEB_CHAT_VERSION = "2.66.0";

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
  ENV_PATH: {
    EC2: {
      SOURCE: {
        ANDROID: ["dist/ec2/android/**/*.*", "!dist/ec2/android/fonts/**/*.*"],
        IOS: ["dist/ec2/ios/**/*.*", "!dist/ec2/ios/fonts/**/*.*"],
        WEB: ["dist/ec2/web/**/*.*", "!dist/ec2/web/fonts/**/*.*"]
      },
      DEST: {
        ANDROID: "dist/ec2/android/",
        IOS: "dist/ec2/ios/",
        WEB: "dist/ec2/web/"
      },
      WEB_CHAT_ROOT: "https://webchat.helpshift.com",
      API_ROOT: "https://api.helpshift.com"
    },
    AZURE: {
      SOURCE: ["dist/azure/**/*.*", "!dist/azure/fonts/**/*.*"],
      DEST: "dist/azure/"
    },
    LOCALSHIVA: {
      SOURCE: {
        ANDROID: ["dist/localshiva/android/**/*.*", "!dist/localshiva/android/fonts/**/*.*"],
        IOS: ["dist/localshiva/ios/**/*.*", "!dist/localshiva/ios/fonts/**/*.*"],
        WEB: ["dist/localshiva/web/**/*.*", "!dist/localshiva/web/fonts/**/*.*"]
      },
      DEST: {
        ANDROID: "dist/localshiva/android/",
        IOS: "dist/localshiva/ios/",
        WEB: "dist/localshiva/web/"
      },
      WEB_CHAT_ROOT: "https://webchat.helpshift.mobi",
      API_ROOT: "https://api.helpshift.mobi"
    }
  },
  localhostSource: ["localhost/**/*.*", "!localhost/fonts/**/*.*"],
  localhostDest: "localhost/",

  // Specific paths to run the local server
  webChatSrcDev: "localhost/scripts/external/webChat.js",

  // Library bundle specific path
  // @NOTE - Any new file added to libs folder will not be automatically minified
  // You will have to add it explicity to following array.
  // IMPORTANT - Make sure the the require js item is the last one. Add your
  // library file above it.
  bundleLibsSource: [
    "static/libs/core-js-polyfill-min.js",
    "static/libs/react-min.js",
    "static/libs/react-pure-render-mixin-fake.js",
    "static/libs/react-dom-min.js",
    "static/libs/react-addons-update-min.js",
    "static/libs/prop-types-min.js",
    "static/libs/create-react-class-min.js",
    "static/libs/redux-min.js",
    "static/libs/react-redux-min.js",
    "static/libs/axios-min.js",
    "static/libs/purify-min.js",
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
  SRI: {
    EC2: {
      WEB: {
        SOURCE: {
          APP: "dist/ec2/web/scripts/app-min.js",
          LIBS: "dist/ec2/web/libs/libs-min.js"
        },
        DEST: "dist/ec2/web/html/index.html"
      },
      ANDROID: {
        SOURCE: {
          APP: "dist/ec2/android/scripts/app-min.js",
          LIBS: "dist/ec2/android/libs/libs-min.js"
        },
        DEST: "dist/ec2/android/html/index.html"
      },
      IOS: {
        SOURCE: {
          APP: "dist/ec2/ios/scripts/app-min.js",
          LIBS: "dist/ec2/ios/libs/libs-min.js"
        },
        DEST: "dist/ec2/ios/html/index.html"
      }
    },
    AZURE: {
      SOURCE: {
        APP: "dist/azure/scripts/app-min.js",
        LIBS: "dist/azure/libs/libs-min.js"
      },
      DEST: "dist/azure/html/index.html"
    },
    LOCALSHIVA: {
      WEB: {
        SOURCE: {
          APP: "dist/localshiva/web/scripts/app-min.js",
          LIBS: "dist/localshiva/web/libs/libs-min.js"
        },
        DEST: "dist/localshiva/web/html/index.html"
      },
      ANDROID: {
        SOURCE: {
          APP: "dist/localshiva/android/scripts/app-min.js",
          LIBS: "dist/localshiva/android/libs/libs-min.js"
        },
        DEST: "dist/localshiva/android/html/index.html"
      },
      IOS: {
        SOURCE: {
          APP: "dist/localshiva/ios/scripts/app-min.js",
          LIBS: "dist/localshiva/ios/libs/libs-min.js"
        },
        DEST: "dist/localshiva/ios/html/index.html"
      }
    }
  },

  externalJsSrc: "dist/scripts/external/*.js",
  externalJsDest: "dist/scripts/external/"
};

const URL_PATHS = {
  WEBCHAT: "/{{platform}}/webChat.js",
  APP_MIN: "/{{platform}}/scripts/app-min.js",
  LIB_MIN: "/{{platform}}/libs/libs-min.js",
  INDEX_HTML: "/{{platform}}/html/index.html",
  STYLE: "/{{platform}}/css/style.css",
  FONT: "/{{platform}}/fonts/hesticons/",
  AVATAR: "/assets.helpshift{{domain}}/"
};

const ANDROID_STATIC_FILE_CACHE_TIME = 86400000;

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
    <script src="{{ENV_WEB_CHAT_ROOT}}/libs/core-js-polyfill-min.js"></script>
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
></script>`,
      LOCALSHIVA: `<script src="{{ENV_WEB_CHAT_ROOT}}/libs/libs-min.js?v=${WEB_CHAT_VERSION}" \
integrity="{{LIBS_BUNDLE_HASH}}" crossorigin="anonymous"></script>`
    }
  },
  APP: {
    DEV: '<script src="{{ENV_WEB_CHAT_ROOT}}/scripts/pages/webSdk.js"></script>',
    PROD: {
      EC2: `<script src="{{ENV_WEB_CHAT_ROOT}}/scripts/app-min.js?v=${WEB_CHAT_VERSION}" \
integrity="{{APP_BUNDLE_HASH}}" crossorigin="anonymous"></script>`,
      AZURE: `<script src="{{ENV_WEB_CHAT_ROOT}}/scripts/app-min.js?v=${WEB_CHAT_VERSION}"\
></script>`,
      LOCALSHIVA: `<script src="{{ENV_WEB_CHAT_ROOT}}/scripts/app-min.js?v=${WEB_CHAT_VERSION}" \
integrity="{{APP_BUNDLE_HASH}}" crossorigin="anonymous"></script>`
    }
  }
};

const PLATFORM = {
  ANDROID: "ANDROID",
  IOS: "IOS",
  WEB: "WEB"
};

const CLOUD = {
  EC2: "EC2",
  AZURE: "AZURE",
  LOCALSHIVA: "LOCALSHIVA"
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
 * @param {String} bundlePath - bundle path from the dist directory
 * @returns {String} A string of latest three hashes.
 */
const getBundleHash = (bundlePath) => {
  const hsSri = require(PATHS.requirePath.hsSri);
  return hsSri[bundlePath].slice(0, MAX_SRI_LIMIT_PER_INTEGRITY_ATTRIBUTE).join(" ");
};

/**
 * Replace env specific template strings with given values
 */
const replaceEnvString = ({platform, cloud}) => {
  let platformPath = "";

  if (platform !== PLATFORM.WEB) {
    platformPath = "/" + platform.toLowerCase();
  }

  return gulp
    .src(PATHS.ENV_PATH[cloud].SOURCE[platform])
    .pipe(
      replace("{{TEMPLATES_LIB_PATH}}", TEMPLATE_PATHS.LIBS.PROD[cloud], {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{TEMPLATES_APP_PATH}}", TEMPLATE_PATHS.APP.PROD[cloud], {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{ENV_WEB_CHAT_ROOT}}", PATHS.ENV_PATH[cloud].WEB_CHAT_ROOT + platformPath, {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{ENV_API_ROOT}}", PATHS.ENV_PATH[cloud].API_ROOT, {
        skipBinary: true
      })
    )
    .pipe(gulp.dest(PATHS.ENV_PATH[cloud].DEST[platform]));
};

const buildEc2Ios = () => replaceEnvString({platform: PLATFORM.IOS, cloud: CLOUD.EC2});

const buildEc2Android = () => replaceEnvString({platform: PLATFORM.ANDROID, cloud: CLOUD.EC2});

const buildEc2Web = () => replaceEnvString({platform: PLATFORM.WEB, cloud: CLOUD.EC2});

/**
 * Production task.
 * Replace Azure specific template strings with given values
 */
const buildAzureTask = () =>
  gulp
    .src(PATHS.ENV_PATH.AZURE.SOURCE)
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
    .pipe(gulp.dest(PATHS.ENV_PATH.AZURE.DEST));

const buildLocalshivaIos = () =>
  replaceEnvString({platform: PLATFORM.IOS, cloud: CLOUD.LOCALSHIVA});

const buildLocalshivaAndroid = () =>
  replaceEnvString({platform: PLATFORM.ANDROID, cloud: CLOUD.LOCALSHIVA});

const buildLocalshivaWeb = () =>
  replaceEnvString({platform: PLATFORM.WEB, cloud: CLOUD.LOCALSHIVA});

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
    SRI: {EC2, AZURE, LOCALSHIVA}
  } = PATHS;

  const DEST_PATHS = [
    EC2.WEB.SOURCE.APP,
    EC2.WEB.SOURCE.LIBS,
    EC2.ANDROID.SOURCE.APP,
    EC2.ANDROID.SOURCE.LIBS,
    EC2.IOS.SOURCE.APP,
    EC2.IOS.SOURCE.LIBS,
    AZURE.SOURCE.APP,
    AZURE.SOURCE.LIBS,
    LOCALSHIVA.WEB.SOURCE.APP,
    LOCALSHIVA.WEB.SOURCE.LIBS,
    LOCALSHIVA.ANDROID.SOURCE.APP,
    LOCALSHIVA.ANDROID.SOURCE.LIBS,
    LOCALSHIVA.IOS.SOURCE.APP,
    LOCALSHIVA.IOS.SOURCE.LIBS
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
 * This task generates whitelist static resources url mapping
 * that we will use to download and cache the mentioned resources in android
 * When user first launches the chat screen, android downloads these
 * resources by intercepting https calls from webview.
 * On next launch of chat screen, it will serve resources from local
 * when intercepting the corresponding https calls.
 */
const generateMappingFileTask = ({platform, cloud}, done) => {
  const domain = cloud === CLOUD.LOCALSHIVA ? ".mobi" : ".com";
  const filePath = path.join(
    "dist",
    cloud.toLowerCase(),
    platform.toLowerCase(),
    "android-mapping.json"
  );
  const mapping = {
    url_paths: [],
    ttl: ANDROID_STATIC_FILE_CACHE_TIME
  };

  Object.keys(URL_PATHS).forEach((urlPath) => {
    let whitelistPath = URL_PATHS[urlPath].replace("{{platform}}", platform.toLowerCase());
    whitelistPath = whitelistPath.replace("{{domain}}", domain);

    mapping.url_paths.push({
      path: whitelistPath,
      ttl: ANDROID_STATIC_FILE_CACHE_TIME
    });
  });

  fs.writeFile(filePath, JSON.stringify(mapping), done);
};

const generateLocalshivaAndroidWhitelistedMappingFile = (done) =>
  generateMappingFileTask({platform: PLATFORM.ANDROID, cloud: CLOUD.LOCALSHIVA}, done);

const generateEc2AndroidWhitelistedMappingFile = (done) =>
  generateMappingFileTask({platform: PLATFORM.ANDROID, cloud: CLOUD.EC2}, done);

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

const updateSriTask = ({platform, cloud}) => {
  const platformPath = "/" + platform.toLowerCase();
  const cloudPath = "/" + cloud.toLowerCase();

  return gulp
    .src(PATHS.SRI[cloud][platform].DEST)
    .pipe(
      replace("{{LIBS_BUNDLE_HASH}}", getBundleHash(PATHS.SRI[cloud][platform].SOURCE.LIBS), {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{APP_BUNDLE_HASH}}", getBundleHash(PATHS.SRI[cloud][platform].SOURCE.APP), {
        skipBinary: true
      })
    )
    .pipe(gulp.dest(path.join("dist", cloudPath, platformPath, "/html/")));
};

const updateEc2AndroidSri = () => updateSriTask({platform: PLATFORM.ANDROID, cloud: CLOUD.EC2});

const updateEc2IosSri = () => updateSriTask({platform: PLATFORM.IOS, cloud: CLOUD.EC2});

const updateEc2WebSri = () => updateSriTask({platform: PLATFORM.WEB, cloud: CLOUD.EC2});

const updateAzureSriTask = () =>
  gulp
    .src(PATHS.SRI.AZURE.DEST)
    .pipe(
      replace("{{LIBS_BUNDLE_HASH}}", getBundleHash(PATHS.SRI.AZURE.SOURCE.LIBS), {
        skipBinary: true
      })
    )
    .pipe(
      replace("{{APP_BUNDLE_HASH}}", getBundleHash(PATHS.SRI.AZURE.SOURCE.APP), {
        skipBinary: true
      })
    )
    .pipe(gulp.dest("dist/azure/html/"));

const updateLocalshivaAndroidSri = () =>
  updateSriTask({platform: PLATFORM.ANDROID, cloud: CLOUD.LOCALSHIVA});

const updateLocalshivaIosSri = () =>
  updateSriTask({platform: PLATFORM.IOS, cloud: CLOUD.LOCALSHIVA});

const updateLocalshivaWebSri = () =>
  updateSriTask({platform: PLATFORM.WEB, cloud: CLOUD.LOCALSHIVA});

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
exports.updateLocalshivaSri = gulp.parallel(
  updateLocalshivaAndroidSri,
  updateLocalshivaIosSri,
  updateLocalshivaWebSri
);
exports.updateAzureSri = updateAzureSriTask;
exports.updateEc2Sri = gulp.parallel(updateEc2AndroidSri, updateEc2IosSri, updateEc2WebSri);
exports.updateSriList = updateSriListTask;
exports.bundleLibs = bundleLibsTask;
exports.buildLocalshiva = gulp.parallel(
  buildLocalshivaIos,
  buildLocalshivaAndroid,
  buildLocalshivaWeb,
  generateLocalshivaAndroidWhitelistedMappingFile
);
exports.buildAzure = buildAzureTask;
exports.compileScriptsProd = compileScriptsProdTask;
exports.buildEc2 = gulp.parallel(
  buildEc2Android,
  buildEc2Ios,
  buildEc2Web,
  generateEc2AndroidWhitelistedMappingFile
);
exports.libs = libsTask;
