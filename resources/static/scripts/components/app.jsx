/**
 * Main entry point for React app.
 * Renders React app.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("components/app",
  ["reducers/rootReducer",
    "utils/postMessage",
    "constants/eventTypes"],
  function (rootReducer, postMessage, EVENT_TYPES) {
    "use strict";

    const Provider = ReactRedux.Provider,
          createStore = Redux.createStore;

    /**
     * Main wrapper component for React application.
     */
    const App = React.createClass ({
      displayName: "App",
      render: function () {
        return (
          <div>Chat With us</div>
        );
      }
    });

    const init = function () {
      const store = createStore (rootReducer);

      ReactDOM.render (
        <Provider store={store}>
          <App />
        </Provider>,
        document.getElementById ("app")
      );

      postMessage (EVENT_TYPES.SDK_INITIALISED);
    };

    return {
      init
    };
  }
);
