/**
 * ViewWrapper Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/viewWrapper",
  [
    "constants/activeView",
    "components/containers/chatView",
    "components/containers/faqView",
    "components/containers/csatView",
    "components/containers/businessHoursView",
    "extras/accessibility",
    "constants/accessibility",
    "constants/keyCodes"
  ],
  function (ACTIVE_VIEW, ChatViewContainer, FaqViewContainer, CsatViewContainer,
    BusinessHoursViewContainer, ax, axConstants, KEY_CODES) {
    "use strict";

    const PropTypes = React.PropTypes;

    const {METALIST_GROUP_NAME} = axConstants;

    return React.createClass ({
      displayName: "ViewWrapper",
      propTypes: {
        activeView: PropTypes.string.isRequired,
        showCloseButton: PropTypes.bool.isRequired,
        allowFullScreen: PropTypes.bool,
        viewStyles: PropTypes.shape ({
          fontFamily: PropTypes.string
        }),
        keyboardInteractionIsActive: PropTypes.bool.isRequired,
        onToggleOnlineStatus: PropTypes.func.isRequired,
        onMinimizeConversation: PropTypes.func.isRequired,
        onFocusLauncher: PropTypes.func,
        onKeyPress: PropTypes.func.isRequired,
        onClick: PropTypes.func.isRequired,
        showLauncher: PropTypes.bool
      },

      render () {
        return this._renderActiveViewComponent ();
      },

      /**
       * Render the active view component.
       */
      _renderActiveViewComponent () {
        const {
          allowFullScreen,
          viewStyles,
          showCloseButton,
          keyboardInteractionIsActive
        } = this.props;

        const commonProps = {
          allowFullScreen,
          onMinimizeConversation: this._onMinimizeConversation,
          viewStyles,
          showCloseButton,
          keyboardInteractionIsActive
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
      _onMinimizeConversation () {
        this.props.onMinimizeConversation ();
      },

      _onOnline () {
        this.props.onToggleOnlineStatus (true);
      },

      _onOffline () {
        this.props.onToggleOnlineStatus (false);
      },

      _onKeyPress (ev) {
        if (ev.shiftKey && ev.keyCode === KEY_CODES.TAB) {
          ax.focusPrev ();
          this.props.onKeyPress ({
            keyboardInteractionIsActive: true
          });
          ev.preventDefault ();
        } else if (ev.keyCode === KEY_CODES.TAB) {
          ax.focusNext ();
          this.props.onKeyPress ({
            keyboardInteractionIsActive: true
          });
          ev.preventDefault ();
        }
      },

      // Set keyboard interaction is active flag to false on click
      _onClick () {
        this.props.onClick ({
          keyboardInteractionIsActive: false
        });
      },

      componentWillMount () {
        ax.setActiveView (this.props.activeView);
      },

      componentDidMount () {
        const {
          showLauncher
        } = this.props;

        window.addEventListener ("online", this._onOnline);
        window.addEventListener ("offline", this._onOffline);
        window.addEventListener ("keydown", this._onKeyPress);
        window.addEventListener ("click", this._onClick);

        ax.init ({
          showLauncher,
          handlers: [
            {
              group: METALIST_GROUP_NAME.LAUNCHER_BTN,
              handlers: [this.props.onFocusLauncher]
            }
          ]
        });
      },

      componentWillUnmount () {
        window.removeEventListener ("online", this._onOnline);
        window.removeEventListener ("offline", this._onOffline);
        window.removeEventListener ("keydown", this._onKeyPress);
        window.removeEventListener ("click", this._onClick);
      }
    });
  }
);
