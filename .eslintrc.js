module.exports = {
  "plugins": [
    "react",
    "hs"
  ],
  "parserOptions": {
    "ecmaVersion": 6,
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "env": {
    "browser": true,
    "amd": true,
    "es6": true,
    "jest": true
  },
  "globals": {
    "React": true,
    "ReactDOM": true,
    "Redux": true,
    "ReactRedux": true,
    "Helpshift": true,
    "ReduxThunk": true
  },
  "rules": {
    // Check ESLint documentation (http://eslint.org/docs/rules/<a-specific-rule>)
    // for details of the rules.

    // Possible errors
    "comma-dangle": 2,
    "no-cond-assign": [2, "always"],
    "no-console": 2,
    "no-constant-condition": 2,
    "no-control-regex": 2,
    "no-debugger": 2,
    "no-dupe-args": 2,
    "no-dupe-keys": 2,
    "no-duplicate-case": 2,
    "no-empty-character-class": 2,
    "no-empty": 2,
    "no-ex-assign": 2,
    "no-extra-boolean-cast": 2,
    "no-extra-semi": 2,
    "no-func-assign": 2,
    "no-inner-declarations": 2,
    "no-invalid-regexp": 2,
    "no-irregular-whitespace": 2,
    "no-negated-in-lhs": 2,
    "no-obj-calls": 2,
    "no-regex-spaces": 2,
    "no-sparse-arrays": 2,
    "no-unreachable": 2,
    "use-isnan": 2,
    "valid-typeof": 2,
    "no-unexpected-multiline": 2,

    // Best Practices
    "curly": 2,
    "dot-notation": [2],
    "dot-location": [2, "property"],
    "eqeqeq": 2,
    "guard-for-in": 2,
    "no-alert": 2,
    "no-caller": 2,
    "no-div-regex": 2,
    "no-eval": 2,
    "no-extend-native": 2,
    "no-extra-bind": 2,
    "no-fallthrough": 2,
    "no-floating-decimal": 2,
    "no-implied-eval": 2,
    "no-iterator": 2,
    "no-labels": 2,
    "no-lone-blocks": 2,
    "no-multi-spaces": [2, {
      "exceptions": {
        "Property": true
      }
    }],
    "no-multi-str": 2,
    "no-native-reassign": 2,
    "no-new-func": 2,
    "no-new-wrappers": 2,
    "no-new": 2,
    "no-octal-escape": 2,
    "no-octal": 2,
    "no-proto": 2,
    "no-redeclare": 2,
    "no-return-assign": 2,
    "no-script-url": 2,
    "no-self-compare": 2,
    "no-sequences": 2,
    "no-throw-literal": 2,
    "no-unused-expressions": 2,
    "no-useless-call": 2,
    "no-void": 2,
    "no-with": 2,
    "radix": 2,
    "vars-on-top": 2,
    "wrap-iife": [2, "inside"],

    // Strict Mode
    "strict": 2,

    // Variables
    "no-delete-var": 2,
    "no-shadow-restricted-names": 2,
    "no-shadow": 2,
    "no-undef-init": 2,
    "no-undef": 2,
    "no-unused-vars": 2,

    // Stylistic Issues
    "array-bracket-spacing": [2, "never"],
    "block-spacing": [2, "never"],
    "brace-style": [2, "1tbs"],
    "camelcase": [2, {
      "properties": "never"
    }],
    "comma-spacing": [2, {
      "before": false,
      "after": true
    }],
    "comma-style": 2,
    "computed-property-spacing": 2,
    "func-style": [2, "expression"],
    "indent": [2, 2, {
      "VariableDeclarator": {
        "var": 2,
        "let": 2,
        "const": 3
      },
      "SwitchCase": 1
    }],
    "linebreak-style": 2,
    "new-cap": [2, {
      "capIsNewExceptions": ["YUI"]
    }],
    "new-parens": 2,
    "no-array-constructor": 2,
    "no-lonely-if": 2,
    "no-mixed-spaces-and-tabs": 2,
    "no-nested-ternary": 2,
    "no-new-object": 2,
    "no-trailing-spaces": 2,
    "no-unneeded-ternary": 2,
    "object-curly-spacing": [2, "never"],
    "operator-linebreak": [2, "after"],
    "quote-props": [2, "consistent-as-needed", {
      "keywords": true
    }],
    "quotes": [2, "double"],
    "semi-spacing": 2,
    "semi": 2,
    "keyword-spacing": 2,
    "space-before-blocks": [2, "always"],
    "space-before-function-paren": [2, "always"],
    "space-in-parens": [2, "never"],
    "space-infix-ops": 2,
    "space-unary-ops": 2,
    "jsx-quotes": [2, "prefer-double"],
    "spaced-comment": [2, "always", {
      "exceptions": ["*"]
    }],

    // Legacy
    "max-len": [2, 100, 2],

    // ES6
    "arrow-parens": [2, "always"],
    "arrow-spacing": 2,
    "no-class-assign": 2,
    "no-const-assign": 2,
    "no-dupe-class-members": 2,
    "prefer-const": 2,
    "template-curly-spacing": [2, "never"],

    // JSX Specific
    "react/display-name": 2,
    "react/jsx-closing-bracket-location": [2, {
      "location": "after-props"
    }],
    "react/jsx-curly-spacing": [2, "never"],
    "react/jsx-no-duplicate-props": 2,
    "react/jsx-uses-vars": 2,
    "react/jsx-no-undef": 2,
    "react/no-danger": 2,
    "react/no-did-update-set-state": 2,
    "react/no-unknown-property": 2,
    "react/prop-types": [2, {
      "ignore": ["children", "className"]
    }],
    "react/self-closing-comp": 2,
    "react/sort-comp": [2, {
      "order": [
        "displayName",
        "mixins",
        "propTypes",
        "getDefaultProps",
        "getInitialState",
        "render",
        "/_render.+$/",
        "everything-else",
        "lifecycle",
        "statics"
      ],
      "groups": {
        "lifecycle": [
          "componentWillReceiveProps",
          "shouldComponentUpdate",
          "componentWillUpdate",
          "componentDidUpdate",
          "componentWillMount",
          "componentDidMount",
          "componentWillUnmount"
        ]
      }
    }],
    "react/wrap-multilines": 2,

    // Helpshift Specific
    "hs/func-call-spacing": [2, "always"]
  }
}
