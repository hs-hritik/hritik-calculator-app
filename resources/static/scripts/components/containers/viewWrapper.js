/**
 * ViewWrapper Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/containers/viewWrapper",
  [
    "components/viewWrapper",
    "constants/uiConfig",
    "actions/actionCreators"
  ],
  function (ViewWrapper, UI_CONFIG_CONSTANTS, actionCreators) {
    "use strict";

    const {BASE_FONT} = UI_CONFIG_CONSTANTS.FLATTENED_UI_CONFIG;

    const mapStateToProps = (state) => {
      return {
        activeView: state.appState.activeView,
        browserIsMobile: state.appState.browserIsMobile,
        allowFullScreen: state.appState.sdkConfigOptions.fullScreen,
        viewStyles: {
          fontFamily: state.ui.uiConfig [BASE_FONT].value
        }
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onToggleOnlineStatus: (online) => {
          dispatch (actionCreators.toggleOnlineStatus (online));
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ViewWrapper);
  }
);
