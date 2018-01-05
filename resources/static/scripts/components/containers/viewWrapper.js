/**
 * ViewWrapper Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/containers/viewWrapper",
  [
    "components/viewWrapper",
    "constants/uiConfig"
  ],
  function (ViewWrapper, UI_CONFIG_CONSTANTS) {
    "use strict";

    const {BASE_FONT} = UI_CONFIG_CONSTANTS.FLATTENED_UI_CONFIG;

    const mapStateToProps = (state) => {
      return {
        activeView: state.appState.activeView,
        browserIsMobile: state.appState.browserIsMobile,
        viewStyles: {
          fontFamily: state.ui.uiConfig [BASE_FONT].value
        }
      };
    };

    return ReactRedux.connect (mapStateToProps) (ViewWrapper);
  }
);
