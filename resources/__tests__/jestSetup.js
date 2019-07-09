/* eslint-env node */
/**
 * Set up file used by jest. This is consumed in jest.config.js.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 19 June, 2019
 */
const enzyme = require ("enzyme");
const Adapter = require ("enzyme-adapter-react-15.4");

// Update node's global object with references to React, Redux, etc for tests.
if (!global.React || !global.Redux || !global.ReactRedux) {
  const React = require ("react");
  const PureRenderMixin = require ("react-addons-pure-render-mixin");
  const update = require ("react-addons-update");
  const Redux = require ("redux");
  const ReactRedux = require ("react-redux");

  // Add react, react-addons, and redux to the global scope.
  // We can't use `libs/react-with-addons` and `libs/redux` because jest
  // also requires react and redux from node_modules.
  // Running multiple instances of react and redux will throw an error so we use
  // react and redux from node_modules and manually add them to the global scope.
  global.React = React;
  React.addons = {
    PureRenderMixin,
    update
  };
  global.Redux = Redux;
  global.ReactRedux = ReactRedux;
}

// Enzyme setup
enzyme.configure ({adapter: new Adapter ()});
