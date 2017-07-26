/**
 * Main entry point for React app.
 * Renders React app.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("components/app",
  [
    "store",
    "utils/postMessage",
    "constants/eventTypes",
    "actions/appState",
    "components/containers/viewWrapper"
  ],
  function (store, postMessage, EVENT_TYPES, appStateActions, ViewWrapperContainer) {
    "use strict";

    const Provider = ReactRedux.Provider;

    /**
     * Main wrapper component for React application.
     */
    const App = React.createClass ({
      displayName: "App",
      render () {
        return (<ViewWrapperContainer />);
      }
    });

    const init = (config) => {
      store.dispatch (appStateActions.setClientConfig (config));

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
