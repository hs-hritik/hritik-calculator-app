/**
 * ChatView Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/chatView",
  [
    "components/messageList",
    "constants/propTypes",
    "constants/chatView"
  ],
  function (MessageList, PROP_TYPES, CHAT_VIEW_CONSTANTS) {
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
          // @TODO: Return ReplyBox
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
        activeFooter: PropTypes.string.isRequired
      },

      render () {
        return (
          <div>
            <MessageList messages={this.props.messages} />
            <ChatViewFooter activeFooter={this.props.activeFooter} />
          </div>
        );
      }
    });

  }
);
