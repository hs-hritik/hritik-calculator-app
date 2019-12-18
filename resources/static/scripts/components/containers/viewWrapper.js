/**
 * ViewWrapper Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define("components/containers/viewWrapper", [
  "components/viewWrapper",
  "constants/uiConfig",
  "actions/actionCreators",
  "actions/postSdkMessage"
], function(ViewWrapper, UI_CONFIG_CONSTANTS, actionCreators, postSdkMessage) {
  "use strict";

  const {BASE_FONT} = UI_CONFIG_CONSTANTS.FLATTENED_UI_CONFIG;

  const mapStateToProps = (state) => {
    const {
      appState: {
        activeView,
        showHeaderCloseButton,
        sdkConfigOptions: {fullScreen: allowFullScreen, showLauncher},
        keyboardInteractionIsActive
      }
    } = state;

    return {
      activeView,
      allowFullScreen,
      showCloseButton: showHeaderCloseButton,
      viewStyles: {
        fontFamily: state.ui.uiConfig[BASE_FONT].value
      },
      keyboardInteractionIsActive,
      showLauncher
    };
  };

  const mapDispatchToProps = (dispatch) => {
    return {
      onToggleOnlineStatus: (online) => {
        dispatch(actionCreators.toggleOnlineStatus(online));
      },
      onMinimizeConversation: () => {
        dispatch(postSdkMessage.toggleMessenger(true));
      },
      onFocusLauncher: () => {
        dispatch(postSdkMessage.focusLauncher());
      },
      onKeyPress: ({keyboardInteractionIsActive}) => {
        dispatch(actionCreators.setKeyboardInteractionIsActive(keyboardInteractionIsActive));
      },
      onClick: ({keyboardInteractionIsActive}) => {
        dispatch(actionCreators.setKeyboardInteractionIsActive(keyboardInteractionIsActive));
      }
    };
  };

  return ReactRedux.connect(mapStateToProps, mapDispatchToProps)(ViewWrapper);
});
