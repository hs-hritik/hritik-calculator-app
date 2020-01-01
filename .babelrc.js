const esmFiles = require("./esmFiles");

module.exports = {
  presets: ["@babel/preset-env", "@babel/preset-react"],
  overrides: [
    {
      test: esmFiles,
      presets: [["@babel/preset-env", {modules: "amd"}]],
      env: {
        test: {
          presets: [
            [
              "@babel/preset-env",
              {
                modules: "commonjs",
                targets: {
                  node: "12.14.0"
                }
              }
            ]
          ]
        }
      }
    }
  ],
  env: {
    test: {
      presets: [
        [
          "@babel/preset-env",
          {
            targets: {
              node: "12.14.0"
            }
          }
        ],
        "@babel/preset-react"
      ],
      plugins: ["transform-amd-to-commonjs"]
    }
  }
};
