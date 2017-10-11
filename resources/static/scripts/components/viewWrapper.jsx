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
    "extras/postSdkMessage"
  ],
  function (ACTIVE_VIEW, ChatViewContainer, FaqViewContainer, CsatViewContainer,
    BusinessHoursViewContainer, postSdkMessage) {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "ViewWrapper",
      propTypes: {
        activeView: PropTypes.string.isRequired,
        browserIsMobile: PropTypes.bool
      },

      render () {
        return this._renderActiveViewComponent ();
      },

      /**
       * Render the active view component.
       */
      _renderActiveViewComponent () {
        const commonProps = {
          browserIsMobile: this.props.browserIsMobile,
          onMinimizeConversation: this._onMinimizeConversation
        };

        switch (this.props.activeView) {
          case ACTIVE_VIEW.CHAT:
            return <ChatViewContainer {...commonProps} />;

          case ACTIVE_VIEW.FAQ:
            return <FaqViewContainer />;

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
        postSdkMessage.toggleMessenger (true);
      }
    });
  }
);
