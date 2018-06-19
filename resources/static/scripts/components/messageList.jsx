/**
 * MessageList Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/messageList",
  [
    "components/message",
    "components/commons/branding",
    "helpers/message",
    "constants/propTypes",
    "constants/chatView",
    "gunpowder/utils/throttle",
    "gunpowder/utils/classes"
  ],
  function (Message, Branding, messageHelpers, customPropTypes, chatViewConstants,
    throttle, classes) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {
      MESSAGE_PROP_TYPE,
      USER_INPUT_PROP_TYPE
    } = customPropTypes;
    const {USER_INPUT_TYPES} = chatViewConstants;
    // Scroll throttle time in ms
    const SCROLL_THROTTLE_TIMER = 250;

    // After how much scrolling to the top, will the jump
    // to latest button be shown?
    const JUMP_LATEST_BTN_SCROLL_THRESHOLD = 200;

    // We are using EaseInQuad function which ensures that scrolling
    // animation is smooth. Ref: https://gist.github.com/gre/1650294
    //
    // This variable is to ensure that it starts off fast.
    const JUMP_LATEST_BTN_ANIM_FACTOR = 100;

    // Load more throttle time in ms
    const LOAD_MORE_THROTTLE_TIMER = 1000;

    // At what positiong from the top, should more messages
    // be loaded?
    const LOAD_MORE_SCROLL_THRESHOLD = 500;

    return React.createClass ({
      displayName: "MessageList",
      propTypes: {
        messages: PropTypes.arrayOf (MESSAGE_PROP_TYPE).isRequired,
        showAgentNickname: PropTypes.bool,
        onSuggestedFaqClick: PropTypes.func,
        onRetryAttachmentClick: PropTypes.func,
        isTyping: PropTypes.bool,
        text: PropTypes.object.isRequired,
        userInput: USER_INPUT_PROP_TYPE,
        onPillOptionSelect: PropTypes.func.isRequired,
        onToggleJumpToLatestBtn: PropTypes.func,
        onLoadMore: PropTypes.func,
        /**
         * If chat view footer has any failure
         */
        hasFailure: PropTypes.bool
      },

      render () {
        return (
          <div ref={this._refCallback}
               className="hs-view__scroll-wrapper"
               onScroll={this._onScroll}>
            <div className="hs-message-list" >
              {this._renderMessages ()}
              {this._renderTypingIndicator ()}
              {this._renderPillOptions ()}
              {this._renderBranding ()}
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
          // Avoid rendering of unnecessary message types.
          if (!messageHelpers.isRenderableMessage (message.type)) {
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
                       onImageLoad={this._throttledScrollBottom}
                       onRetryAttachmentClick={this.props.onRetryAttachmentClick}
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

      /**
       * Render pill options
       */
      _renderPillOptions () {
        const {
          userInput: {
            type,
            options,
            label,
            disabled
          },
          hasFailure
        } = this.props;

        // @TODO: Re-consider the approach to render the ChatViewFooterContainer
        // here directly, and render the pill select options inside the chat view footer.
        // This will avoid passing the props like userInput, hasFailure to the
        // MessageList component.
        if (hasFailure || type !== USER_INPUT_TYPES.PILL_SELECT || disabled) {
          return null;
        }

        const btnClasses = classes (
          "hs-button",
          "hs-button--hollow",
          "hs-message-list__pill-option"
        );
        const pillOptionsEl = options.map ((option) => {
          return (
            <button key={option.value}
                    onClick={this._onPillOptionClick.bind (this, option)}
                    className={btnClasses}>
              {option.label}
            </button>
          );
        });

        return (
          <div className="hs-message-list__pills-container">
            <small>
              <strong className="hs-message-list__pill-heading">
                {label}
              </strong>
            </small>
            <div className="hs-message-list__pill-options">
              {pillOptionsEl}
            </div>
          </div>
        );
      },

      /**
       * Render branding
       */
      _renderBranding () {
        if (this.props.userInput.type === USER_INPUT_TYPES.PILL_SELECT) {
          return null;
        }
        return (
          <Branding text={this.props.text} />
        );
      },

      /**
       * Click handler for pill options (buttons)
       * @param {Object} option - selected option
       */
      _onPillOptionClick (option) {
        this.props.onPillOptionSelect (option);
      },

      _onScroll (ev) {
        const {
          scrollHeight,
          scrollTop,
          offsetHeight
        } = ev.target;

        if (scrollTop + offsetHeight + JUMP_LATEST_BTN_SCROLL_THRESHOLD < scrollHeight) {
          this.props.onToggleJumpToLatestBtn (true);
        } else {
          this.props.onToggleJumpToLatestBtn (false);
        }

        if (scrollTop < LOAD_MORE_SCROLL_THRESHOLD) {
          this._throttledLoadMore ();
        }
      },

      _scrollWrapperRef: null,

      /**
       * Ref callback handler.
       */
      _refCallback (ref) {
        this._scrollWrapperRef = ref;
      },

      /**
       * Throttled scroll bottom method used to delay scroll bottom execution
       * As images can load simultaneously, this method will get called
       * multiple times
       */
      _throttledScrollBottom: null,

      /**
       * Prevent multiple calls of load more function when user scrolls
       * to the top of messages.
       */
      _throttledLoadMore: null,

      /**
       * Scroll message list to the bottom.
       */
      _scrollToBottom () {
        const node = ReactDOM.findDOMNode (this._scrollWrapperRef);
        node.scrollTop = node.scrollHeight;
      },

      _scrollAnimLoop (node, time = 0) {
        // To scroll smoothly we are using EaseInQuad easing function.
        // Ref: https://gist.github.com/gre/1650294
        node.scrollTop += JUMP_LATEST_BTN_ANIM_FACTOR * time * time;

        if (node.scrollTop + node.offsetHeight < node.scrollHeight) {
          // Each animation frame corresponds to 16.6 ms = ~0.016s
          const scrollAnimFunc = this._scrollAnimLoop.bind (this, node, time + 0.016);
          requestAnimationFrame (scrollAnimFunc);
        }
      },

      /**
       * Scroll message list to the bottom.
       */
      _animatedScrollToBottom () {
        const node = ReactDOM.findDOMNode (this._scrollWrapperRef);
        this._scrollAnimLoop (node);
      },

      /**
       * Scroll to bottom if messages length is increased,
       * or if there is typing indicator.
       */
      componentDidUpdate (prevProps) {
        const currentValidMessages = this.props.messages.filter ((message) => {
          return !!message;
        });
        const previousValidMessages = prevProps.messages.filter ((message) => {
          return !!message;
        });

        if ((currentValidMessages.length > previousValidMessages.length)) {
          this._scrollToBottom ();
        }
      },

      /**
       * Scroll the bottom when the component is mounted.
       */
      componentDidMount () {
        // @TODO :- Remove throttling logic as the image will have fixed width
        // and height. We will not require bottom scrolling logic then.
        // Also we will need to fix the width and height of image container
        // when it is being uploaded (dummy message) and after it is uploaded (BE message)
        this._throttledScrollBottom = throttle (
          this._scrollToBottom, SCROLL_THROTTLE_TIMER
        );

        this._throttledLoadMore = throttle (this.props.onLoadMore, LOAD_MORE_THROTTLE_TIMER);

        this._scrollToBottom ();
      }
    });
  }
);
