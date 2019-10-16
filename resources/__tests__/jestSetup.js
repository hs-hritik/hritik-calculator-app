/* eslint-env node */
/**
 * Set up file used by jest. This is consumed in jest.config.js.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 19 June, 2019
 */
const enzyme = require ("enzyme");
const Adapter = require ("enzyme-adapter-react-16");

// Add react, react-addons, create-react-class, prop-types and redux to the
// global scope. We can't use `libs/react-with-addons` and `libs/redux`
// because jest also requires react and redux from node_modules.
// Running multiple instances of react and redux will throw an error so we use
// react and redux from node_modules and manually add them to the global scope.
if (!global.React) {
  global.React = require ("react");
  global.React.addons = {
    PureRenderMixin: require ("react-addons-pure-render-mixin"),
    update: require ("react-addons-update")
  };
}

if (!global.createReactClass) {
  global.createReactClass = require ("create-react-class");
}

if (!global.PropTypes) {
  global.PropTypes = require ("prop-types");
}

if (!global.Redux) {
  global.Redux = require ("redux");
}

if (!global.ReactRedux) {
  global.ReactRedux = require ("react-redux");
}

// Enzyme setup
enzyme.configure ({adapter: new Adapter ()});
