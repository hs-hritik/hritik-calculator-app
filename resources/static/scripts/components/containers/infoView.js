/**
 * Info View Container.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Apr 10, 2018
 */

define ("components/containers/infoView",
  [
    "components/infoView"
  ],
  function (InfoView) {
    "use strict";

    const mapStateToProps = (state) => {
      const {
        appState: {
          loading
        }
      } = state;

      return {
        loading
      };
    };

    return ReactRedux.connect (mapStateToProps) (InfoView);
  }
);
