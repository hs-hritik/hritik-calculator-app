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
    "extras/postSdkMessage"
  ],
  function (ACTIVE_VIEW, ChatViewContainer, FaqViewContainer, CsatViewContainer, postSdkMessage) {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "ViewWrapper",
      propTypes: {
        activeView: PropTypes.string.isRequired,
        browserIsMobile: PropTypes.bool
      },

      render () {
        // @TODO: Add header component.
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

          default:
            return null;
        }
      },

      /**
       * Handler for minimize conversation.
       */
      _onMinimizeConversation () {
        // @TODO: If state is closed, reset the conversation.
        postSdkMessage.toggleMessenger (true);
      }
    });
  }
);
