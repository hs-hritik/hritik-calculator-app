/**
 * MessageList Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/messageList",
  [
    "components/message",
    "constants/propTypes",
    "constants/message"
  ],
  function (Message, PROP_TYPES, MESSAGE_CONSTANTS) {
    "use strict";

    const PropTypes = React.PropTypes;
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
        showAgentNickname: PropTypes.bool,
        onSuggestedFaqClick: PropTypes.func,
        isTyping: PropTypes.bool,
        text: PropTypes.object.isRequired
      },

      render () {
        return (
          <div className="hs-message-list"
               ref={this._refCallback}>
            {this._renderMessages ()}
            {this._renderTypingIndicator ()}
          </div>
        );
      },

      /**
       * Render messages and timestamp.
       */
      _renderMessages () {
        const {messages} = this.props;

        return messages.map ((message, index) => {
          // Avoid rendering of unnecessary message types.
          if (MESSAGE_TYPES_TO_RENDER.indexOf (message.type) === -1) {
            return null;
          }
          return (
            <div key={message.id}>
              <Message message={message}
                       isLastMessage={messages.length === (index + 1)}
                       showAgentNickname={this.props.showAgentNickname}
                       text={this.props.text}
                       onSuggestedFaqClick={this.props.onSuggestedFaqClick} />
            </div>
          );
        });
      },

      /**
       * Render the typing indicator.
       */
      _renderTypingIndicator () {
        if (!this.props.isTyping) {
          return null;
        }

        // @TODO: Add css and typing icon.
        return (
          <span>Typing</span>
        );
      },

      _messageListRef: null,

      /**
       * Ref callback handler.
       */
      _refCallback (ref) {
        this._messageListRef = ref;
      },

      /**
       * Scroll message list to the given position.
       * @param {Number} position - scrollTop position.
       */
      _scrollTo (position) {
        const node = ReactDOM.findDOMNode (this._messageListRef);
        node.scrollTop = position;
      },

      /**
       * Scroll to bottom if messages length is increased.
       */
      componentDidUpdate (prevProps) {
        if (this.props.messages.length > prevProps.messages.length) {
          const node = ReactDOM.findDOMNode (this._messageListRef);
          this._scrollTo (node.scrollHeight);
        }
      },

      /**
       * Scroll the bottom when the component is mounted.
       */
      componentDidMount () {
        const node = ReactDOM.findDOMNode (this._messageListRef);
        this._scrollTo (node.scrollHeight);
      }
    });
  }
);
