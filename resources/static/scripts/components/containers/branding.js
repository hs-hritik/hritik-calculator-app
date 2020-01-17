/**
 * Wrapper Component for branding.
 * @author Shubham Jain <shubham@helpshift.com>
 * @created Apr 12, 2019
 */

define("components/containers/branding", [
  "gunpowder/utils/withErrorBoundary",
  "components/commons/branding",
  "utils/logReactError"
], function(withErrorBoundary, Branding, logReactErrorEsm) {
  "use strict";

  const logReactError = logReactErrorEsm.default;

  const mapStateToProps = (state) => {
    const {
      appState: {
        featuresEnabled: {branding}
      },
      ui: {text}
    } = state;

    return {
      hide: !branding,
      text
    };
  };

  const connectedComponent = ReactRedux.connect(mapStateToProps)(Branding);
  const fallbackComponent = null;
  const handleError = (error, info) => {
    logReactError(error, info);
  };

  return withErrorBoundary(connectedComponent, fallbackComponent, handleError);
});
