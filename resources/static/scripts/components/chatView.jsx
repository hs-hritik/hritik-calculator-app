/**
 * ChatView Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/chatView",
  [
    "components/messageList",
    "components/containers/chatViewFooter",
    "components/infoView",
    "components/commons/viewHeader",
    "components/commons/dndWrapper",
    "constants/propTypes",
    "constants/chatView",
    "components/jumpToLatestBtn",
    "gunpowder/utils/classes",
    "gunpowder/constants/widgets/picker",
    "gunpowder/utils/object",
    "gunpowder/widgets/errorBoundary",
    "components/errors/appError",
    "utils/logReactError"
  ],
  function (MessageList, ChatViewFooterContainer, InfoView, ViewHeader,
    DnDWrapper, customPropTypes, CHAT_VIEW_CONSTANTS, JumpToLatestBtn, classes,
    LIST_PICKER_CONSTANTS, objUtils, ErrorBoundary, AppError, logReactError) {
    "use strict";

    const {
      MESSAGE_PROP_TYPE,
      USER_INPUT_PROP_TYPE
    } = customPropTypes;
    const {USER_INPUT_TYPES} = CHAT_VIEW_CONSTANTS;
    const {
      TOGGLE_STATES: LIST_PICKER_TOGGLE_STATES
    } = LIST_PICKER_CONSTANTS;

    const CHAT_VIEW_COMMON_PROPS = {
      messages: PropTypes.arrayOf (MESSAGE_PROP_TYPE).isRequired,
      onSuggestedFaqClick: PropTypes.func,
      showAgentNickname: PropTypes.bool,
      isTyping: PropTypes.bool,
      userIsViewingPastMessages: PropTypes.bool,
      minimized: PropTypes.bool,
      loadingMoreMsgsHasFailed: PropTypes.bool,
      onScrollPastExistingConversation: PropTypes.func,
      onLoadMoreMessages: PropTypes.func,
      onFilesDrop: PropTypes.func.isRequired,
      onRetryAttachmentClick: PropTypes.func.isRequired,
      userInput: USER_INPUT_PROP_TYPE,
      issueIsCreated: PropTypes.bool.isRequired,
      onPillOptionSelect: PropTypes.func.isRequired,
      onListPickerOptionSelect: PropTypes.func,
      onSkipUserInput: PropTypes.func,
      text: PropTypes.shape ({
        chatViewHeader: PropTypes.string.isRequired,
        dndInfoText: PropTypes.string.isRequired,
        pastConversationsLoadingText: PropTypes.string.isRequired
      }).isRequired,
      loading: PropTypes.bool,
      pastConversationsLoading: PropTypes.bool,
      allMessagesAreLoaded: PropTypes.bool,
      latestConversationHasLoaded: PropTypes.bool,
      unreadCount: PropTypes.number,
      /**
       * If chat view footer has any failure
       */
      hasFailure: PropTypes.bool,
      botStepInProgress: PropTypes.bool
    };

    /**
     * Fallback component for Chat View Footer. This will be rendered when
     * Chat View Footer fails to render
     */
    const FooterFallback = () => (
      <div className="hs-chat-view__footer-error">
        <i className="hs-chat-view__footer-error-icon ion-alert-circled" />
        <div>
          Something went wrong. Please refresh the page or try again later.
        </div>
      </div>
    );

    class ChatViewContents extends React.PureComponent {
      constructor (props) {
        super (props);
        this._msgListRef = React.createRef ();

        this._onLoadMore = this._onLoadMore.bind (this);
        this._onFilesDrop = this._onFilesDrop.bind (this);
        this._onJumpBtnClick = this._onJumpBtnClick.bind (this);
      }

      render () {
        const {
          messages,
          isTyping,
          showAgentNickname,
          text,
          onPillOptionSelect,
          onListPickerOptionSelect,
          onRetryAttachmentClick,
          onSuggestedFaqClick,
          onScrollPastExistingConversation,
          onSkipUserInput,
          userInput,
          issueIsCreated,
          loading,
          hasFailure,
          pastConversationsLoading,
          userIsViewingPastMessages,
          botStepInProgress,
          minimized
        } = this.props;

        const dragAndDropEnabled = issueIsCreated && !botStepInProgress;

        if (loading) {
          return (
            <InfoView loading={loading} />
          );
        }

        return (
          <DnDWrapper
            onDrop={this._onFilesDrop}
            dragInfoText={text.dndInfoText}
            enabled={dragAndDropEnabled}>
            {this._renderLoader ()}
            <div className="hs-view__content">
              <MessageList
                messages={messages}
                isTyping={isTyping}
                showAgentNickname={showAgentNickname}
                text={text}
                pastConversationsLoading={pastConversationsLoading}
                onPillOptionSelect={onPillOptionSelect}
                onRetryAttachmentClick={onRetryAttachmentClick}
                onSuggestedFaqClick={onSuggestedFaqClick}
                onSkipUserInput={onSkipUserInput}
                hasFailure={hasFailure}
                userInput={userInput}
                userIsViewingPastMessages={userIsViewingPastMessages}
                onScrollPastExistingConversation={onScrollPastExistingConversation}
                onLoadMore={this._onLoadMore}
                ref={this._msgListRef}
                minimized={minimized} />
              {this._renderJumpToLatestBtn ()}
            </div>
            {this._renderPickerOverlay ()}
            <ErrorBoundary
              fallbackComponent={<FooterFallback />}
              onError={this._handleFooterError}>
              <ChatViewFooterContainer
                onJumpBtnClick={this._onJumpBtnClick}
                onListPickerOptionSelect={onListPickerOptionSelect} />
            </ErrorBoundary>
          </DnDWrapper>
        );
      }

      _renderLoader () {
        const {
          pastConversationsLoading,
          loadingMoreMsgsHasFailed,
          text: {
            pastConversationsLoadingText,
            loadMoreMessagesFailedText,
            clickToRetryText
          }
        } = this.props;

        if (!pastConversationsLoading) {
          if (loadingMoreMsgsHasFailed) {
            return (
              <div className="hs-chat-view__msgs-loader-container">
                <span className="hs-chat-view__msg-loading-failed-txt">
                  {loadMoreMessagesFailedText}
                </span>
                <a onClick={this.props.onLoadMoreMessages}
                  className="hs-chat-view__msg-loading-failed-link">
                  <strong>{clickToRetryText}</strong>
                </a>
              </div>
            );
          }
          return null;
        }

        const loaderClasses = classes (
          "ion-load-b",
          "ion--spinning",
          "hs-chat-view__msgs-loader-spinner"
        );

        return (
          <div className="hs-chat-view__msgs-loader-container">
            <i className={loaderClasses} />
            <span>{pastConversationsLoadingText}</span>
          </div>
        );
      }

      /**
       * Render jump to latest button when input pills are rendered
       * and chat view footer is hidden
       */
      _renderJumpToLatestBtn () {
        const {
          userIsViewingPastMessages,
          unreadCount,
          userInput: {
            type
          }
        } = this.props;

        const showUnreadIndicator = unreadCount > 0;
        const inputIsPillSelect = (type === USER_INPUT_TYPES.PILL_SELECT);

        if (inputIsPillSelect) {
          return (
            <div className="hs-chat-view__jump-to-latest-wrapper">
              <JumpToLatestBtn
                show={userIsViewingPastMessages}
                showUnreadIndicator={showUnreadIndicator}
                onClick={this._onJumpBtnClick} />
            </div>
          );
        }

        return null;
      }

      /**
       * Renders the picker overlay if picker is in resizing state
       */
      _renderPickerOverlay () {
        const {
          userInput: {
            listPicker: {
              toggleState
            }
          }
        } = this.props;

        if (toggleState !== LIST_PICKER_TOGGLE_STATES.RESIZING) {
          return null;
        }

        return (
          <div className="hs-list-picker-overlay" />
        );
      }

      _onJumpBtnClick () {
        this._msgListRef.current._animatedScrollToBottom ();
      }

      /**
       * Handler for files dropped event
       * @param {Object} - files list array like object
       */
      _onFilesDrop (files) {
        this.props.onFilesDrop (files);
      }

      _onLoadMore () {
        const {
          allMessagesAreLoaded,
          latestConversationHasLoaded,
          loadingMoreMsgsHasFailed,
          onLoadMoreMessages
        } = this.props;

        // If conversation history is enabled, we need to load more
        // till all messages have been loaded. When disabled, only the
        // latest conversation needs to load.
        //
        // If loading messages has failed, we should only allow loading more
        // messages when "Tap To Retry" is clicked.
        if (!allMessagesAreLoaded && !latestConversationHasLoaded && !loadingMoreMsgsHasFailed) {
          onLoadMoreMessages ();
        }
      }

      /**
       * Handle error thrown in Chat View Footer
       * @param {object} error - Error object
       * @param {object} info - Additional info including stack trace
       */
      _handleFooterError (error, info) {
        logReactError (error, info);
      }
    }

    ChatViewContents.propTypes = CHAT_VIEW_COMMON_PROPS;

    return createReactClass ({
      displayName: "ChatView",
      propTypes: objUtils.shallowMerge ({
        onMinimizeConversation: PropTypes.func,
        showCloseButton: PropTypes.bool.isRequired,
        viewStyles: PropTypes.shape ({
          fontFamily: PropTypes.string
        }),
        // @TODO: Confirm whether these props can be removed. They are not being
        // used anywhere
        error: PropTypes.shape ({
          // Error title
          title: PropTypes.string.isRequired,
          // Error subtitle
          subtitle: PropTypes.string,
          // Call to action text for the error. eg. Retry
          cta: PropTypes.string
        }),
        errorActionHandler: PropTypes.func,
        browserIsMobile: PropTypes.bool
        // End @TODO
      }, CHAT_VIEW_COMMON_PROPS),

      getInitialState () {
        return {
          showJumpToLatestBtn: false
        };
      },

      render () {
        const {
          showCloseButton,
          onMinimizeConversation,
          text,
          viewStyles,
          minimized
        } = this.props;

        // In certain cases, Safari ignores scroll events on
        // the web chat window, making it impossible to scroll through
        // the messages. This usually happens after toggling the
        // web chat launcher.
        //
        // The root cause is not known but it was found that the
        // problem is fixed when reflow/repaint is triggered on the
        // Webchat component.
        //
        // Therefore, we assign a special class whenever the chat window
        // is maximized to trigger reflow.
        const viewClasses = classes ("hs-view", {
          "hs-view--safari-fix": !minimized
        });

        return (
          <div className={viewClasses} style={viewStyles}>
            <ViewHeader
              title={text.chatViewHeader}
              showCloseBtn={showCloseButton}
              onCloseBtnClick={onMinimizeConversation} />
            {this._renderViewContents ()}
          </div>
        );
      },

      _renderViewContents () {
        const {
          messages,
          onSuggestedFaqClick,
          showAgentNickname,
          isTyping,
          userIsViewingPastMessages,
          minimized,
          loadingMoreMsgsHasFailed,
          onScrollPastExistingConversation,
          onLoadMoreMessages,
          onRetryAttachmentClick,
          userInput,
          issueIsCreated,
          onPillOptionSelect,
          onListPickerOptionSelect,
          onSkipUserInput,
          onFilesDrop,
          text
        } = this.props;

        return (
          <ErrorBoundary
            fallbackComponent={<AppError />}
            onError={this._handleChatViewError}>
            <ChatViewContents
              messages={messages}
              onSuggestedFaqClick={onSuggestedFaqClick}
              showAgentNickname={showAgentNickname}
              isTyping={isTyping}
              userIsViewingPastMessages={userIsViewingPastMessages}
              minimized={minimized}
              loadingMoreMsgsHasFailed={loadingMoreMsgsHasFailed}
              onScrollPastExistingConversation={onScrollPastExistingConversation}
              onLoadMoreMessages={onLoadMoreMessages}
              onFilesDrop={onFilesDrop}
              onRetryAttachmentClick={onRetryAttachmentClick}
              userInput={userInput}
              issueIsCreated={issueIsCreated}
              onPillOptionSelect={onPillOptionSelect}
              onListPickerOptionSelect={onListPickerOptionSelect}
              onSkipUserInput={onSkipUserInput}
              text={text} />
          </ErrorBoundary>
        );
      },

      _handleChatViewError (error, info) {
        logReactError (error, info);
      }
    });
  }
);
