module.exports = {
  "extends": "@helpshiftdev/eslint-config-hs",
  "globals": {
    "React": true,
    "ReactDOM": true,
    "Redux": true,
    "ReactRedux": true,
    "Helpshift": true,
    "ReduxThunk": true,
    "createReactClass": true,
    "PropTypes": true
  },
  rules: {
    "react-hooks/rules-of-hooks": "off",
    "react-hooks/exhaustive-deps": "off"
  }
}
