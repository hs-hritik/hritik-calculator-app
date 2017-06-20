/**
 * MessageList Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/messageList",
  [
    "components/message",
    "constants/propTypes",
    "constants/message",
    "gunpowder/utils/date"
  ],
  function (Message, PROP_TYPES, MESSAGE_CONSTANTS, dateUtils) {
    "use strict";

    const PropTypes = React.PropTypes;
    const CONVERSATION_DATE_FORMAT = "{mmm} {dd}, {yyyy}";
    const MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE;

    const MESSAGE_TYPES_TO_RENDER = [
      MESSAGE_TYPE.TEXT,
      MESSAGE_TYPE.FAQ
    ];

    return React.createClass ({
      displayName: "MessageList",
      propTypes: {
        messages: PropTypes.arrayOf (PropTypes.shape (
          PROP_TYPES.MESSAGE
        )).isRequired,
        onSuggestedFaqClick: PropTypes.func
      },

      render () {
        return (
          <div>
            {this._renderMessages ()}
          </div>
        );
      },

      /**
       * Render messages and timestamp.
       */
      _renderMessages () {
        return this.props.messages.map ((message, index) => {
          // Avoid rendering of unnecessary message types.
          if (MESSAGE_TYPES_TO_RENDER.indexOf (message.type) === -1) {
            return null;
          }

          return (
            <div key={message.id}>
              {this._renderTimestamp (index)}
              <Message {...message}
                       onSuggestedFaqClick={this.props.onSuggestedFaqClick} />
            </div>
          );
        });
      },

      /**
       * Render timestamp if the next message is on different
       * day than the previous message.
       */
      _renderTimestamp (msgIndex) {
        const messages = this.props.messages,
              prevMsg = messages [msgIndex - 1],
              nextMsg = messages [msgIndex];

        if (prevMsg &&
            (prevMsg.createdTs.toDateString () === nextMsg.createdTs.toDateString ())) {
          return null;
        }

        const dateStr = dateUtils.format (nextMsg.createdTs, CONVERSATION_DATE_FORMAT);

        return (
          <span>{dateStr}</span>
        );
      }
    });
  }
);
