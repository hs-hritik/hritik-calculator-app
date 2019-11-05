/**
 * Main entry point for React app.
 * Renders React app.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("components/app",
  [
    "store",
    "components/containers/viewWrapper",
    "gunpowder/widgets/errorBoundary",
    "components/errors/appError",
    "utils/logReactError"
  ],
  function (store, ViewWrapperContainer, ErrorBoundary, AppError,
    logReactError) {
    "use strict";

    const Provider = ReactRedux.Provider;
    let _isAppMounted = false;

    /**
     * Main wrapper component for React application.
     */
    const App = createReactClass ({
      displayName: "App",

      render () {
        return (<ViewWrapperContainer />);
      },

      componentDidMount () {
        _isAppMounted = true;
      },

      componentWillUnmount () {
        _isAppMounted = false;
      }
    });

    /**
     * Handle errors in error boundary
     * @param {Object} error - Error thrown by react
     * @param {Object} info - Additional info about error
     */
    const handleError = (error, info) => {
      logReactError (error, info);
    };

    /**
     * Render app.
     */
    const init = () => {
      ReactDOM.render (
        <ErrorBoundary
          fallbackComponent={<AppError />}
          onError={handleError}>
          <Provider store={store}>
            <App />
          </Provider>
        </ErrorBoundary>,
        document.getElementById ("app")
      );
    };

    /**
     * Unmount app.
     */
    const unmount = () => {
      ReactDOM.unmountComponentAtNode (document.getElementById ("app"));
    };

    return {
      isMounted: () => _isAppMounted,
      init,
      unmount
    };
  }
);
