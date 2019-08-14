/**
 * Wrapper Component for branding.
 * @author Shubham Jain <shubham@helpshift.com>
 * @created Apr 12, 2019
 */

define ("components/containers/branding",
  [
    "components/commons/branding"
  ],
  function (Branding) {
    "use strict";

    const mapStateToProps = (state) => {
      const {
        appState: {
          featuresEnabled: {
            branding
          }
        },
        ui: {
          text
        }
      } = state;

      return {
        hide: !branding,
        text
      };
    };

    return ReactRedux.connect (mapStateToProps) (Branding);
  }
);
