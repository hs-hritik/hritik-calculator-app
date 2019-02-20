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
    "gunpowder/constants/widgets/picker"
  ],
  function (MessageList, ChatViewFooterContainer, InfoView, ViewHeader,
    DnDWrapper, customPropTypes, CHAT_VIEW_CONSTANTS, JumpToLatestBtn, classes,
    LIST_PICKER_CONSTANTS) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {
      MESSAGE_PROP_TYPE,
      USER_INPUT_PROP_TYPE
    } = customPropTypes;
    const {USER_INPUT_TYPES} = CHAT_VIEW_CONSTANTS;
    const {
      TOGGLE_STATES: LIST_PICKER_TOGGLE_STATES
    } = LIST_PICKER_CONSTANTS;

    return React.createClass ({
      displayName: "ChatView",
      propTypes: {
        messages: PropTypes.arrayOf (MESSAGE_PROP_TYPE).isRequired,
        onSuggestedFaqClick: PropTypes.func,
        showAgentNickname: PropTypes.bool,
        isTyping: PropTypes.bool,
        userIsViewingPastMessages: PropTypes.bool,
        minimized: PropTypes.bool,
        browserIsMobile: PropTypes.bool,
        onMinimizeConversation: PropTypes.func,
        onScrollPastExistingConversation: PropTypes.func,
        onLoadMoreMessages: PropTypes.func,
        showCloseButton: PropTypes.bool.isRequired,
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
        viewStyles: PropTypes.shape ({
          fontFamily: PropTypes.string
        }),
        loading: PropTypes.bool,
        pastConversationsLoading: PropTypes.bool,
        allMessagesAreLoaded: PropTypes.bool,
        latestConversationHasLoaded: PropTypes.bool,
        unreadCount: PropTypes.number,
        /**
         * If chat view footer has any failure
         */
        hasFailure: PropTypes.bool,
        error: PropTypes.shape ({
          // Error title
          title: PropTypes.string.isRequired,
          // Error subtitle
          subtitle: PropTypes.string,
          // Call to action text for the error. eg. Retry
          cta: PropTypes.string
        }),
        errorActionHandler: PropTypes.func,
        botStepInProgress: PropTypes.bool
      },

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
            <ViewHeader title={text.chatViewHeader}
                        showCloseBtn={showCloseButton}
                        onCloseBtnClick={onMinimizeConversation} />
            {this._renderViewContents ()}
          </div>
        );
      },

      _renderLoader () {
        const {
          pastConversationsLoading,
          text: {
            pastConversationsLoadingText
          }
        } = this.props;

        if (!pastConversationsLoading) {
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
      },

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
      },

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
      },

      /**
       * Render view contents
       */
      _renderViewContents () {
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
          error,
          userIsViewingPastMessages,
          errorActionHandler,
          botStepInProgress,
          minimized
        } = this.props;

        const dragAndDropEnabled = issueIsCreated && !botStepInProgress;

        if (loading || (error && error.title)) {
          return (
            <InfoView loading={loading}
                      title={error.title}
                      subtitle={error.subtitle}
                      actionBtnText={error.cta}
                      onActionBtnClick={errorActionHandler} />
          );
        }

        return (
          <DnDWrapper onDrop={this._onFilesDrop}
                      dragInfoText={text.dndInfoText}
                      enabled={dragAndDropEnabled}>
              {this._renderLoader ()}
              <div className="hs-view__content">
                <MessageList messages={messages}
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
                             onScrollPastExistingConversation={
                               onScrollPastExistingConversation
                             }
                             onLoadMore={this._onLoadMore}
                             ref={this._setMsgListRef}
                             minimized={minimized} />
                {this._renderJumpToLatestBtn ()}
              </div>
              {this._renderPickerOverlay ()}
              <ChatViewFooterContainer onJumpBtnClick={this._onJumpBtnClick}
                                       onListPickerOptionSelect={onListPickerOptionSelect} />
            </DnDWrapper>
        );
      },

      _msgListRef: null,

      _onJumpBtnClick () {
        this._msgListRef._animatedScrollToBottom ();
      },

      _setMsgListRef (ref) {
        this._msgListRef = ref;
      },

      _onLoadMore () {
        const {
          allMessagesAreLoaded,
          latestConversationHasLoaded
        } = this.props;

        // If conversation history is enabled, we need to load more
        // till all messages have been loaded. When disabled, only the
        // latest conversation needs to load.
        if (!allMessagesAreLoaded && !latestConversationHasLoaded) {
          this.props.onLoadMoreMessages ();
        }
      },

      /**
       * Handler for files dropped event
       * @param {Object} - files list array like object
       */
      _onFilesDrop (files) {
        this.props.onFilesDrop (files);
      }
    });
  }
);
