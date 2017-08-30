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
    "components/commons/branding"
  ],
  function (Message, PROP_TYPES, MESSAGE_CONSTANTS, Branding) {
    "use strict";

    const PropTypes = React.PropTypes;
    const MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE;

    const MESSAGE_TYPES_TO_RENDER = [
      MESSAGE_TYPE.TEXT,
      MESSAGE_TYPE.FAQ,
      MESSAGE_TYPE.CSAT,
      MESSAGE_TYPE.END_CHAT
    ];

    return React.createClass ({
      displayName: "MessageList",
      propTypes: {
        messages: PropTypes.arrayOf (PropTypes.shape (
          PROP_TYPES.MESSAGE
        )).isRequired,
        showAgentNickname: PropTypes.bool,
        onSuggestedFaqClick: PropTypes.func,
        onStartCsatSurveyClick: PropTypes.func,
        isTyping: PropTypes.bool,
        text: PropTypes.object.isRequired
      },

      render () {
        return (
          <div ref={this._refCallback} className="hs-view__scroll-wrapper" >
            <div className="hs-message-list" >
              {this._renderMessages ()}
              {this._renderTypingIndicator ()}
              <Branding text={this.props.text} />
            </div>
          </div>
        );
      },

      /**
       * Render messages and timestamp.
       */
      _renderMessages () {
        const {messages} = this.props;

        return messages.map ((message, index) => {
          // @TODO: Added temp fix until we add loading spinner.
          if (!message) {
            return null;
          }
          // Avoid rendering of unnecessary message types.
          if (MESSAGE_TYPES_TO_RENDER.indexOf (message.type) === -1) {
            return null;
          }

          const nextMsg = messages [index + 1];
          let isLastMessageInGroup = true;

          if (nextMsg) {
            isLastMessageInGroup = nextMsg.isCustomerMsg !== message.isCustomerMsg;
          }

          return (
              <Message message={message}
                      key={message.id}
                      isLastMessage={messages.length === (index + 1)}
                      isLastMessageInGroup={isLastMessageInGroup}
                      showAgentNickname={this.props.showAgentNickname}
                      text={this.props.text}
                      onStartCsatSurveyClick={this.props.onStartCsatSurveyClick}
                      onSuggestedFaqClick={this.props.onSuggestedFaqClick} />
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

        return (
          <div className="hs-message-list__typing-indicator">
            <div className="hs-message-list__typing-dot hs-message-list__typing-anim-1" />
            <div className="hs-message-list__typing-dot hs-message-list__typing-anim-2" />
            <div className="hs-message-list__typing-dot hs-message-list__typing-anim-3" />
          </div>
        );
      },

      _scrollWrapperRef: null,

      /**
       * Ref callback handler.
       */
      _refCallback (ref) {
        this._scrollWrapperRef = ref;
      },

      /**
       * Scroll message list to the bottom.
       */
      _scrollToBottom () {
        const node = ReactDOM.findDOMNode (this._scrollWrapperRef);
        node.scrollTop = node.scrollHeight;
      },

      /**
       * Scroll to bottom if messages length is increased,
       * or if there is typing indicator.
       */
      componentDidUpdate (prevProps) {
        if ((this.props.messages.length > prevProps.messages.length)) {
          this._scrollToBottom ();
        }
      },

      /**
       * Scroll the bottom when the component is mounted.
       */
      componentDidMount () {
        this._scrollToBottom ();
      }
    });
  }
);
