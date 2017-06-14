/**
 * ChatView Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/chatView",
  [
    "components/messageList",
    "constants/propTypes",
    "constants/chatView",
    "components/containers/replyBox",
    "components/commons/viewHeader"
  ],
  function (MessageList, PROP_TYPES, CHAT_VIEW_CONSTANTS, ReplyBoxContainer,
            ViewHeader) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {ACTIVE_FOOTER} = CHAT_VIEW_CONSTANTS;

    const ChatViewFooter = React.createClass ({
      displayName: "ChatViewFooter",
      propTypes: {
        activeFooter: PropTypes.string.isRequired
      },

      render () {
        return (
          <div>
            {this._renderFooterComponent ()}
          </div>
        );
      },

      /**
       * Render the active footer component
       */
      _renderFooterComponent () {
        if (this.props.activeFooter === ACTIVE_FOOTER.REPLY) {
          return <ReplyBoxContainer />;
        }

        return null;
      }
    });

    return React.createClass ({
      displayName: "ChatView",
      propTypes: {
        messages: PropTypes.arrayOf (PropTypes.shape (
          PROP_TYPES.MESSAGE
        )).isRequired,
        activeFooter: PropTypes.string.isRequired,
        text: PropTypes.shape ({
          chatViewHeader: PropTypes.string.isRequired
        }).isRequired
      },

      render () {
        return (
          <div>
            <ViewHeader title={this.props.text.chatViewHeader} />
            <MessageList messages={this.props.messages} />
            <ChatViewFooter activeFooter={this.props.activeFooter} />
          </div>
        );
      }
    });
  }
);
