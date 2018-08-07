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
    "gunpowder/utils/classes"
  ],
  function (MessageList, ChatViewFooterContainer, InfoView, ViewHeader,
    DnDWrapper, customPropTypes, classes) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {
      MESSAGE_PROP_TYPE,
      USER_INPUT_PROP_TYPE
    } = customPropTypes;

    return React.createClass ({
      displayName: "ChatView",
      propTypes: {
        messages: PropTypes.arrayOf (MESSAGE_PROP_TYPE).isRequired,
        onSuggestedFaqClick: PropTypes.func,
        showAgentNickname: PropTypes.bool,
        isTyping: PropTypes.bool,
        userIsViewingPastMessages: PropTypes.bool,
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
          viewStyles
        } = this.props;

        return (
          <div className="hs-view" style={viewStyles}>
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
       * Render view contents
       */
      _renderViewContents () {
        const {
          messages,
          isTyping,
          showAgentNickname,
          text,
          onPillOptionSelect,
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
          botStepInProgress
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
                             ref={this._setMsgListRef} />
              </div>
              <ChatViewFooterContainer onJumpBtnClick={this._onJumpBtnClick} />
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
