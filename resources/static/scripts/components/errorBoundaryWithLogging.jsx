/**
 * Wraps React components with Error boundary and adds logging by default
 * @author Ayush Sachdeva <ayush.sachdeva@helpshift.com>
 * @created Nov 18, 2019
 */

define (
  "components/errorBoundaryWithLogging",
  [
    "gunpowder/widgets/errorBoundary",
    "utils/logReactError"
  ],
  function (ErrorBoundary, logReactError) {
    "use strict";

    const ErrorBoundaryWithLogging = ({children, fallbackComponent, onError}) => {
      const handleError = (error, info) => {
        logReactError (error, info);

        if (onError) {
          onError (error, info);
        }
      };

      return (
        <ErrorBoundary
          fallbackComponent={fallbackComponent || null}
          onError={handleError}>
            {children}
        </ErrorBoundary>
      );
    };

    ErrorBoundaryWithLogging.propTypes = {
      /**
       * A react component that gets rendered if any of the children wrapped
       * within this component throws error while rendering. Defaults to null.
       */
      fallbackComponent: PropTypes.node,

      /**
       * Callback that gets called when componentDidCatch lifecycle method is
       * triggered.
       */
      onError: PropTypes.func
    };

    return ErrorBoundaryWithLogging;
  }
);