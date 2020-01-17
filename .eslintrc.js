const esmFiles = require("./esmFiles");

module.exports = {
  extends: "@helpshiftdev/eslint-config-hs",
  globals: {
    React: true,
    ReactDOM: true,
    Redux: true,
    ReactRedux: true,
    Helpshift: true,
    ReduxThunk: true,
    createReactClass: true,
    PropTypes: true
  },
  overrides: [
    {
      files: esmFiles,
      parserOptions: {
        sourceType: "module"
      }
    }
  ]
};
