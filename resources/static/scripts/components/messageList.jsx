/**
 * MessageList Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/messageList",
  [
    "components/message",
    "components/containers/branding",
    "components/commons/skipButtonWrapper",
    "helpers/message",
    "constants/propTypes",
    "constants/chatView",
    "gunpowder/utils/throttle",
    "gunpowder/utils/classes",
    "constants/accessibility",
    "extras/accessibility",
    "helpers/common"
  ],
  function (Message, BrandingContainer, SkipButtonWrapper, messageHelpers, customPropTypes,
    chatViewConstants, throttle, classes, axConstants, ax, commonHelpers) {
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
    //
    // Threshold = Height of two message (57 * 2) +
    // branding height (42) + message list bottom padding (16).
    const JUMP_LATEST_BTN_SCROLL_THRESHOLD = 172;

    // We are using EaseInQuad function which ensures that scrolling
    // animation is smooth. Ref: https://gist.github.com/gre/1650294
    //
    // This variable is to ensure that the animation runs fast.
    const JUMP_LATEST_BTN_ANIM_FACTOR = 10000;

    // Load more throttle time in ms
    const LOAD_MORE_THROTTLE_TIMER = 1000;

    // At what positioning from the top, should more messages
    // be loaded?
    const LOAD_MORE_SCROLL_THRESHOLD = 500;
    const {METALIST_ITEMS, METALIST_GROUP_NAME} = axConstants;

    return React.createClass ({
      displayName: "MessageList",
      propTypes: {
        messages: PropTypes.arrayOf (MESSAGE_PROP_TYPE).isRequired,
        showAgentNickname: PropTypes.bool,
        onSuggestedFaqClick: PropTypes.func,
        onRetryAttachmentClick: PropTypes.func,
        isTyping: PropTypes.bool,
        userIsViewingPastMessages: PropTypes.bool,
        pastConversationsLoading: PropTypes.bool,
        text: PropTypes.object.isRequired,
        userInput: USER_INPUT_PROP_TYPE,
        onPillOptionSelect: PropTypes.func.isRequired,
        onScrollPastExistingConversation: PropTypes.func,
        onLoadMore: PropTypes.func,
        onSkipUserInput: PropTypes.func,

        /**
         * Widget is minimized or not
         **/
        minimized: PropTypes.bool.isRequired,
        /**
         * If chat view footer has any failure
         */
        hasFailure: PropTypes.bool
      },

      render () {
        return (
          <div ref={this._refCallback}
               className="hs-view__scroll-wrapper"
               onScroll={this._eventPresistedScroll}
               data-label={METALIST_ITEMS.CHAT.MSGS_SCROLL_WRAPPER.DATA_LABEL}
               tabIndex="0">
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
                       onImageLoad={this._onImageAttachmentLoad}
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
        const {text} = this.props;
        return (
          <div
            className="hs-message-list__typing-indicator"
            aria-label={text.ariaLabelTypingIndicator}>
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
            disabled,
            required,
            skipLabel
          },
          hasFailure,
          onSkipUserInput
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
          const pillDataLabel = (
            METALIST_ITEMS.CHAT.FOOTER.OPTION_PILL_PREFIX.DATA_LABEL +
            option.value
          );
          const setPillAxActiveIndex = this._setAxActiveIndex.bind (
            this, {
              selector: `[data-label=${pillDataLabel}]`
            }
          );

          return (
            <button key={option.value}
                    onClick={this._onPillOptionClick.bind (this, option)}
                    className={btnClasses}
                    data-label={pillDataLabel}
                    tabIndex="0"
                    onFocus={setPillAxActiveIndex}>
              {option.label}
            </button>
          );
        });

        let skipBtnWrapperEl = null;

        if (!required) {
          const setAxActiveIndex = this._setAxActiveIndex.bind (
            this, {
              selector: METALIST_ITEMS.CHAT.SKIP_BTN.SELECTOR
            }
          );
          const skipBtnDataLabels = {
            skipBtn: METALIST_ITEMS.CHAT.SKIP_BTN.DATA_LABEL
          };

          skipBtnWrapperEl = (
            <SkipButtonWrapper label={skipLabel}
                               className="hs-message-list__skip-btn-wrapper"
                               disabled={disabled}
                               onClick={onSkipUserInput}
                               dataLabels={skipBtnDataLabels}
                               onFocus={setAxActiveIndex} />
          );
        }

        const setPillWrapperAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: METALIST_ITEMS.CHAT.FOOTER.OPTION_PILLS_WRAPPER.SELECTOR
          }
        );

        return (
          <div className="hs-message-list__pills-container">
            <small aria-hidden={true}>
              <strong className="hs-message-list__pill-heading">
                {label}
              </strong>
            </small>
            <div
              className="hs-message-list__pill-options"
              data-label={METALIST_ITEMS.CHAT.FOOTER.OPTION_PILLS_WRAPPER.DATA_LABEL}
              tabIndex="0"
              onClick={setPillWrapperAxActiveIndex}
              onFocus={setPillWrapperAxActiveIndex}
              aria-label={label}>
              {pillOptionsEl}
            </div>
            {skipBtnWrapperEl}
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
          <BrandingContainer />
        );
      },

      /**
       * Click handler for pill options (buttons)
       * @param {Object} option - selected option
       */
      _onPillOptionClick (option) {
        this.props.onPillOptionSelect (option);
      },

      /**
       * Image load handler for attachment messages
       */
      _onImageAttachmentLoad () {
        // If image attachments are loaded and user is not viewing past messages
        // then scroll to bottom.
        // We are using throttled scroll bottom as multiple images can be loaded
        // at same time.
        if (!this.props.userIsViewingPastMessages) {
          this._throttledScrollBottom ();
        }
      },

      /**
       * Scroll handler to persist event object for throttled scroll
       * @param {Object} ev - Event object
       */
      _eventPresistedScroll (ev) {
        // Ref - https://reactjs.org/docs/events.html#event-pooling
        ev.persist ();
        this._throttledScroll (ev);
      },

      /**
       * Scroll handler of message list
       * @param {Object} ev - Event object
       */
      _onScroll (ev) {
        const {
          scrollHeight,
          scrollTop,
          offsetHeight
        } = ev.target;

        const {
          pastConversationsLoading
        } = this.props;

        this._scrollBottom = scrollHeight - offsetHeight - scrollTop;

        if (scrollTop + offsetHeight + JUMP_LATEST_BTN_SCROLL_THRESHOLD < scrollHeight) {
          this.props.onScrollPastExistingConversation (true);
        } else {
          this.props.onScrollPastExistingConversation (false);
        }

        if (scrollTop < LOAD_MORE_SCROLL_THRESHOLD && !pastConversationsLoading) {
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
       * Scroll position from the bottom of the chat screen.
       */
      _scrollBottom: 0,

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

        // updated scroll bottom after scrollTop is changed.
        this._scrollBottom = 0;
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
       * Restores previous scrolling position
       */
      _restorePreviousScrollPosition () {
        const {
          scrollHeight,
          scrollTop,
          offsetHeight
        } = this._scrollWrapperRef;

        const previousScrollBottom = this._scrollBottom;
        const currentScrollBottom = scrollHeight - offsetHeight - scrollTop;

        if (currentScrollBottom !== previousScrollBottom) {
          this._scrollWrapperRef.scrollTop = scrollHeight - previousScrollBottom - offsetHeight;
        }
      },

      /**
       * Scrolls to bottom when the user sends a message and when
       * new messages is received.
       */
      _handleScrollingToBottom (currentMessages, previousMessages) {
        const {userIsViewingPastMessages} = this.props;

        const currentLastMessage = currentMessages [currentMessages.length - 1];
        const prevLastMessage = previousMessages [previousMessages.length - 1];

        let newUserMessageIsAdded = false;
        let newAgentMessageIsAdded = false;

        if (currentLastMessage.id !== prevLastMessage.id) {
          newUserMessageIsAdded = currentLastMessage.isCustomerMsg;
          newAgentMessageIsAdded = !currentLastMessage.isCustomerMsg;
        }

        // Scrolling to bottom should happen if
        // 1. The user sends a new message from the chat window.
        //   OR
        // 2. A new message is received and use isn't browsing through past messages
        if (newUserMessageIsAdded || (newAgentMessageIsAdded && !userIsViewingPastMessages)) {
          this._scrollToBottom ();
        }
      },

      /**
       * This function is called on focus or click event on element
       * It calls ax function to update active index
       *
       * @param {Object} config.selector - Selector value
       * @param {Object} ev - Click or focus event object
       */
      _setAxActiveIndex (config, ev) {
        ev.stopPropagation ();
        ax.setActiveIndex (config);
      },

      /**
       * Generate selectors list for anchor tags in message list
       *
       * @returns {Array} - An array of selectors strings
       */
      _getLinkSelectors () {
        const messageListLinks = document.querySelectorAll (".hs-message-list a");
        const messageListLinksCount = messageListLinks.length;
        const selectors = [];
        const messageList = document.querySelector (".hs-message-list");

        for (let i = 0; i < messageListLinksCount; i++) {
          const selector = commonHelpers.getSelectorForElement (messageListLinks[i], messageList);
          selectors.push (".hs-message-list " + selector);
        }

        return selectors;
      },

      componentDidUpdate (prevProps) {
        const {messages, minimized} = this.props;
        const previousMessages = prevProps.messages;
        const messageListHasBeenUpdated = previousMessages.length !== messages.length;
        let messagesHaveBeenAppended = false;

        if (messages.length) {
          messagesHaveBeenAppended = (
            !previousMessages.length || (messages [0].id !== previousMessages [0].id)
          );
        }

       /**
        * Restores previous scrolling position when new messages have been
        * appended to the top or if widget is toggled to open state.
        * ON-CALL Issue: https://helpshift.atlassian.net/browse/ONCALL-3088 [Not retaining scroll
        * position when widget is toggled on Firefox]
        */
        if ((!minimized && prevProps.minimized) || messagesHaveBeenAppended) {
          this._restorePreviousScrollPosition ();
        }

        // Scroll to bottom if the messages are being loaded for the
        // first time. This checked by seeing if there were there
        // are messages in current update but there weren't any in
        // the previous one.
        //
        // This condition handles cases where component gets mounted
        // first and gets message update later (hence, escapes the
        // scrollToBottom in componentDidMount)
        if (messages.length && previousMessages.length === 0) {
          this._scrollToBottom ();
        }

        // If there's an empty message list, no processing is needed
        if (!(messages.length && previousMessages.length)) {
          return;
        }

        this._handleScrollingToBottom (messages, previousMessages);

        // If message length count is changed then
        // update message link selectors in meta list and retain the current focus
        if (messageListHasBeenUpdated) {
          ax.saveCurrentFocusedSelector ();
          ax.replaceSelectors ({
            group: METALIST_GROUP_NAME.CHAT.MESSAGE_LIST,
            selectors: this._getLinkSelectors ()
          });
          ax.focusSavedSelector ();
        }
      },

      /**
       * Scroll the bottom when the component is mounted.
       */
      componentDidMount () {
        ax.replaceSelectors ({
          group: METALIST_GROUP_NAME.CHAT.MESSAGE_LIST,
          selectors: this._getLinkSelectors ()
        });

        // @TODO :- Remove throttling logic as the image will have fixed width
        // and height. We will not require bottom scrolling logic then.
        // Also we will need to fix the width and height of image container
        // when it is being uploaded (dummy message) and after it is uploaded (BE message)
        this._throttledScrollBottom = throttle (
          this._scrollToBottom, SCROLL_THROTTLE_TIMER
        );

        this._throttledLoadMore = throttle (this.props.onLoadMore, LOAD_MORE_THROTTLE_TIMER);

        this._throttledScroll = throttle (
          this._onScroll, SCROLL_THROTTLE_TIMER, {leading: false}
        );

        this._scrollToBottom ();
      }
    });
  }
);
