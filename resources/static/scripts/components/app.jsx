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
    "utils/logReactError"
  ],
  function (store, ViewWrapperContainer, logReactError) {
    "use strict";

    const Provider = ReactRedux.Provider;
    let _isAppMounted = false;

    /**
     * Main wrapper component for React application.
     */
    const App = React.createClass ({
      displayName: "App",

      render () {
        return (<ViewWrapperContainer />);
      },

      /**
       * React method used to log error in any child component. This is a
       * temporary implementation which will be replaced with adequate error
       * boundaries.
       * @TODO: Replace this method with an error boundary when react is
       * updated to v16.
       */
      unstable_handleError (error) {
        try {
          logReactError (error);
        } catch (e) {
          /* eslint-disable no-console */
          console.error ("There was an error while logging from React error boundary: ", e);
          console.error ("The error from React is: ", error);
          /* eslint-enable no-console */
        }
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
        <Provider store={store}>
          <App />
        </Provider>,
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
