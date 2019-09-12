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
    "constants/accessibility"
  ],
  function (ACTIVE_VIEW, ChatViewContainer, FaqViewContainer, CsatViewContainer,
    BusinessHoursViewContainer, ax, axConstants) {
    "use strict";

    const PropTypes = React.PropTypes;

    const {KEYCODES} = axConstants;

    return React.createClass ({
      displayName: "ViewWrapper",
      propTypes: {
        activeView: PropTypes.string.isRequired,
        showCloseButton: PropTypes.bool.isRequired,
        allowFullScreen: PropTypes.bool,
        viewStyles: PropTypes.shape ({
          fontFamily: PropTypes.string
        }),
        onToggleOnlineStatus: PropTypes.func.isRequired,
        onMinimizeConversation: PropTypes.func.isRequired
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
          showCloseButton
        } = this.props;

        const commonProps = {
          allowFullScreen,
          onMinimizeConversation: this._onMinimizeConversation,
          viewStyles,
          showCloseButton
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
        if (ev.shiftKey && ev.keyCode === KEYCODES.TAB) {
          ax.focusPrev ();
          ev.preventDefault ();
        } else if (ev.keyCode === KEYCODES.TAB) {
          ax.focusNext ();
          ev.preventDefault ();
        }
      },

      componentDidMount () {
        window.addEventListener ("online", this._onOnline);
        window.addEventListener ("offline", this._onOffline);
        window.addEventListener ("keydown", this._onKeyPress);
      },

      componentWillUnmount () {
        window.removeEventListener ("online", this._onOnline);
        window.removeEventListener ("offline", this._onOffline);
        window.removeEventListener ("keydown", this._onKeyPress);
      }
    });
  }
);
