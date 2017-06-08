/**
 * Main entry point for React app.
 * Renders React app.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("components/app",
  ["store",
    "utils/postMessage",
    "constants/eventTypes",
    "actions/appStateActions"],
  function (store, postMessage, EVENT_TYPES, appStateActions) {
    "use strict";

    const Provider = ReactRedux.Provider;

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

    const init = function (config) {
      store.dispatch (appStateActions.setConfig (config));

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
