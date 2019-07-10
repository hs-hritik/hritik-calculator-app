/* eslint-disable */
// @NOTE - Disabling eslint because even if this is a js file, it serves as a
// config file for requirejs optimizer
// @INFO - For more config options, refer following url
// https://github.com/requirejs/r.js/blob/master/build/example.build.js
({
  // All modules are located relative to this path
  baseUrl: "./resources/dist/scripts",
  // All relative paths set relative to baseUrl above
  paths: {
    reduxThunk: "../libs/redux-thunk",
    uaParser: "../libs/ua-parser",
    axios: "../libs/axios"
  },
  // Entry point of our application without extension as per optimizer config syntax
  name: "pages/webSdk",
  // Output file name
  out: "./resources/dist/scripts/app-min.js",
  // Whether to generate source maps
  generateSourceMaps: true
})
/* eslint-enable */