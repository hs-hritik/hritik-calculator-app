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
    "components/errorBoundaryWithLogging",
    "components/errors/appError"
  ],
  function (store, ViewWrapperContainer, ErrorBoundaryWithLogging, AppError) {
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
     * Render app.
     */
    const init = () => {
      ReactDOM.render (
        <ErrorBoundaryWithLogging fallbackComponent={<AppError />}>
          <Provider store={store}>
            <App />
          </Provider>
        </ErrorBoundaryWithLogging>,
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
