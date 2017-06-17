/**
 * MessageList Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/messageList",
  [
    "components/message",
    "constants/propTypes",
    "gunpowder/utils/date"
  ],
  function (Message, PROP_TYPES, dateUtils) {
    "use strict";

    const PropTypes = React.PropTypes;
    const CONVERSATION_DATE_FORMAT = "{mmm} {dd}, {yyyy}";

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
