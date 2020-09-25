/**
 * ViewWrapper Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define("components/viewWrapper", [
  "constants/activeView",
  "components/containers/chatView",
  "components/containers/faqView",
  "components/containers/csatView",
  "components/containers/businessHoursView",
  "extras/accessibility",
  "constants/accessibility",
  "constants/keyCodes"
], function(
  ACTIVE_VIEW,
  ChatViewContainer,
  FaqViewContainer,
  CsatViewContainer,
  BusinessHoursViewContainer,
  ax,
  axConstants,
  KEY_CODES
) {
  "use strict";

  const {METALIST_GROUP_NAME} = axConstants;

  return createReactClass({
    displayName: "ViewWrapper",
    propTypes: {
      activeView: PropTypes.string.isRequired,
      showCloseButton: PropTypes.bool.isRequired,
      allowFullScreen: PropTypes.bool,
      viewStyles: PropTypes.shape({
        fontFamily: PropTypes.string
      }),
      keyboardInteractionIsActive: PropTypes.bool.isRequired,
      onToggleOnlineStatus: PropTypes.func.isRequired,
      onMinimizeConversation: PropTypes.func.isRequired,
      onFocusLauncher: PropTypes.func,
      onKeyDown: PropTypes.func.isRequired,
      onClick: PropTypes.func.isRequired,
      showLauncher: PropTypes.bool,
      xhrEndedDueToNetworkDisconnect: PropTypes.bool,
      onDeviceOnline: PropTypes.func.isRequired
    },

    render() {
      return this._renderActiveViewComponent();
    },

    /**
     * Render the active view component.
     */
    _renderActiveViewComponent() {
      const {
        allowFullScreen,
        viewStyles,
        showCloseButton,
        keyboardInteractionIsActive
      } = this.props;

      const commonProps = {
        allowFullScreen,
        viewStyles,
        showCloseButton,
        keyboardInteractionIsActive,
        onMinimizeConversation: this._onMinimizeConversation,
        onKeyDown: this._onViewWrapperKeyDown,
        onClick: this._onViewWrapperClick
      };

      switch (this.props.activeView) {
        case ACTIVE_VIEW.CHAT:
          return <ChatViewContainer {...commonProps} />;

        case ACTIVE_VIEW.FAQ:
          return <FaqViewContainer {...commonProps} />;

        case ACTIVE_VIEW.CSAT:
          return <CsatViewContainer {...commonProps} />;

        case ACTIVE_VIEW.BUSINESS_HOURS:
          return <BusinessHoursViewContainer {...commonProps} />;

        default:
          return null;
      }
    },

    /**
     * Handler for minimize conversation.
     */
    _onMinimizeConversation() {
      this.props.onMinimizeConversation();
    },

    _onOnline() {
      const {onToggleOnlineStatus, xhrEndedDueToNetworkDisconnect, onDeviceOnline} = this.props;

      onToggleOnlineStatus(true);
      if (xhrEndedDueToNetworkDisconnect) {
        onDeviceOnline();
      }
    },

    _onOffline() {
      this.props.onToggleOnlineStatus(false);
    },

    _onViewWrapperKeyDown(ev) {
      if (ev.shiftKey && ev.keyCode === KEY_CODES.TAB) {
        ax.focusPrev();
        this.props.onKeyDown({
          keyboardInteractionIsActive: true
        });
        ev.preventDefault();
      } else if (ev.keyCode === KEY_CODES.TAB) {
        ax.focusNext();
        this.props.onKeyDown({
          keyboardInteractionIsActive: true
        });
        ev.preventDefault();
      } else if (ev.keyCode === KEY_CODES.ENTER || ev.keyCode === KEY_CODES.SPACE) {
        document.activeElement.click();
      }
    },

    /**
     * Click handler for view wrapper
     * Sets keyboard interaction is active flag to false
     *
     * NOTE: This will be passed as a callback from container component to each view
     * so that they attach it on the topmost element mostly div having "hs-view"
     */
    _onViewWrapperClick() {
      this.props.onClick({
        keyboardInteractionIsActive: false
      });
    },

    componentWillMount() {
      const {showLauncher} = this.props;

      ax.init({
        showLauncher,
        handlers: [
          {
            group: METALIST_GROUP_NAME.LAUNCHER_BTN,
            handlers: [this.props.onFocusLauncher]
          }
        ]
      });
      ax.setActiveView(this.props.activeView);
    },

    componentDidMount() {
      window.addEventListener("online", this._onOnline);
      window.addEventListener("offline", this._onOffline);
    },

    componentWillUnmount() {
      window.removeEventListener("online", this._onOnline);
      window.removeEventListener("offline", this._onOffline);
    }
  });
});
