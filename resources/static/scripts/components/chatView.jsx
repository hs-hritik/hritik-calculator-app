/**
 * ChatView Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define("components/chatView", [
  "components/messageList",
  "components/containers/chatViewFooter",
  "components/infoView",
  "components/commons/viewHeader",
  "components/commons/dndWrapper",
  "constants/propTypes",
  "constants/chatView",
  "components/jumpToLatestBtn",
  "gunpowder/utils/classes",
  "gunpowder/constants/widgets/dragIt",
  "gunpowder/utils/object",
  "components/errorBoundaryWithLogging",
  "components/errors/appError",
  "components/errors/nonBlockingError",
  "extras/accessibility",
  "constants/activeView"
], function(
  MessageList,
  ChatViewFooterContainer,
  InfoView,
  ViewHeader,
  DnDWrapper,
  customPropTypes,
  CHAT_VIEW_CONSTANTS,
  JumpToLatestBtn,
  classes,
  dragItConstants,
  objUtils,
  ErrorBoundaryWithLogging,
  AppError,
  NonBlockingError,
  ax,
  activeViewConstants
) {
  "use strict";

  const {MESSAGE_PROP_TYPE, USER_INPUT_PROP_TYPE} = customPropTypes;
  const {USER_INPUT_TYPES} = CHAT_VIEW_CONSTANTS;
  const {NAVIGATION_STATES: LIST_PICKER_NAVIGATION_STATES} = dragItConstants;

  class ChatViewContents extends React.PureComponent {
    constructor(props) {
      super(props);
      this._msgListRef = React.createRef();

      this._onLoadMore = this._onLoadMore.bind(this);
      this._onFilesDrop = this._onFilesDrop.bind(this);
      this._onJumpBtnClick = this._onJumpBtnClick.bind(this);
      this._onScrollMessageListToBottom = this._onScrollMessageListToBottom.bind(this);
    }

    render() {
      const {
        messages,
        isTyping,
        showAgentNickname,
        text,
        onPillOptionSelect,
        onListPickerOptionSelect,
        onRetryAttachmentClick,
        onSuggestedFaqClick,
        onActionClick,
        onScrollPastExistingConversation,
        onSkipUserInput,
        userInput,
        loading,
        hasFailure,
        pastConversationsLoading,
        userIsViewingPastMessages,
        minimized,
        onMessageError,
        onFooterError,
        showAvatar,
        avatar,
        avatarLastUpdatedTs,
        attachmentUploadIsInProgress,
        currentIssueId,
        issueState,
        userAttachmentsAreAllowed
      } = this.props;

      if (loading) {
        return <InfoView loading={loading} />;
      }

      return (
        <DnDWrapper
          onDrop={this._onFilesDrop}
          dragInfoText={text.dndInfoText}
          enabled={userAttachmentsAreAllowed}>
          {this._renderLoader()}
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
              onActionClick={onActionClick}
              onSkipUserInput={onSkipUserInput}
              hasFailure={hasFailure}
              userInput={userInput}
              userIsViewingPastMessages={userIsViewingPastMessages}
              onScrollPastExistingConversation={onScrollPastExistingConversation}
              onLoadMore={this._onLoadMore}
              ref={this._msgListRef}
              minimized={minimized}
              onMessageError={onMessageError}
              showAvatar={showAvatar}
              avatar={avatar}
              avatarLastUpdatedTs={avatarLastUpdatedTs}
              attachmentUploadIsInProgress={attachmentUploadIsInProgress}
              currentIssueId={currentIssueId}
              issueState={issueState}
            />
            {this._renderJumpToLatestBtn()}
          </div>
          {this._renderPickerOverlay()}
          <ErrorBoundaryWithLogging onError={onFooterError}>
            <ChatViewFooterContainer
              onJumpBtnClick={this._onJumpBtnClick}
              onScrollMessageListToBottom={this._onScrollMessageListToBottom}
              onListPickerOptionSelect={onListPickerOptionSelect}
              userAttachmentsAreAllowed={userAttachmentsAreAllowed}
            />
          </ErrorBoundaryWithLogging>
        </DnDWrapper>
      );
    }

    _renderLoader() {
      const {
        pastConversationsLoading,
        loadingMoreMsgsHasFailed,
        text: {pastConversationsLoadingText, loadMoreMessagesFailedText, clickToRetryText}
      } = this.props;

      if (!pastConversationsLoading) {
        if (loadingMoreMsgsHasFailed) {
          return (
            <div className="hs-chat-view__msgs-loader-container">
              <span className="hs-chat-view__msg-loading-failed-txt">
                {loadMoreMessagesFailedText}
              </span>
              <a
                onClick={this.props.onLoadMoreMessages}
                className="hs-chat-view__msg-loading-failed-link">
                <strong>{clickToRetryText}</strong>
              </a>
            </div>
          );
        }
        return null;
      }

      const loaderClasses = classes(
        "ion-load-b",
        "ion--spinning",
        "hs-chat-view__msgs-loader-spinner"
      );

      return (
        <div
          className="hs-chat-view__msgs-loader-container"
          aria-label={pastConversationsLoadingText}>
          <i className={loaderClasses} aria-hidden />
          <span aria-hidden>{pastConversationsLoadingText}</span>
        </div>
      );
    }

    /**
     * Render jump to latest button when input pills are rendered
     * and chat view footer is hidden
     */
    _renderJumpToLatestBtn() {
      const {
        userIsViewingPastMessages,
        unreadCount,
        userInput: {type},
        text
      } = this.props;

      const showUnreadIndicator = unreadCount > 0;
      const inputIsPillSelect = type === USER_INPUT_TYPES.PILL_SELECT;

      if (inputIsPillSelect) {
        return (
          <div className="hs-chat-view__jump-to-latest-wrapper">
            <JumpToLatestBtn
              show={userIsViewingPastMessages}
              showUnreadIndicator={showUnreadIndicator}
              onClick={this._onJumpBtnClick}
              ariaLabel={text.ariaLabelJumpToLatestBtn}
            />
          </div>
        );
      }

      return null;
    }

    /**
     * Renders the picker overlay if picker is in resizing state
     */
    _renderPickerOverlay() {
      const {
        userInput: {
          listPicker: {navigationState}
        }
      } = this.props;

      if (navigationState !== LIST_PICKER_NAVIGATION_STATES.RESIZING) {
        return null;
      }

      return <div className="hs-list-picker-overlay" />;
    }

    _onJumpBtnClick() {
      this._msgListRef.current._animatedScrollToBottom();
    }

    /**
     * Handler for files dropped event
     * @param {Object} - files list array like object
     */
    _onFilesDrop(files) {
      this.props.onFilesDrop(files);
    }

    _onLoadMore() {
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
        onLoadMoreMessages();
      }
    }

    /**
     * Scroll message list to bottom
     */
    _onScrollMessageListToBottom() {
      this._msgListRef.current._scrollToBottom();
    }
  }

  ChatViewContents.propTypes = {
    onMessageError: PropTypes.func.isRequired,
    onFooterError: PropTypes.func.isRequired,

    // Props common to chat view & chat view contents
    messages: PropTypes.arrayOf(MESSAGE_PROP_TYPE).isRequired,
    onSuggestedFaqClick: PropTypes.func,
    onActionClick: PropTypes.func,
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
    onPillOptionSelect: PropTypes.func.isRequired,
    onListPickerOptionSelect: PropTypes.func,
    onSkipUserInput: PropTypes.func,
    text: PropTypes.shape({
      chatViewHeader: PropTypes.string.isRequired,
      dndInfoText: PropTypes.string.isRequired,
      pastConversationsLoadingText: PropTypes.string.isRequired,
      loadMoreMessagesFailedText: PropTypes.string,
      clickToRetryText: PropTypes.string,
      ariaLabelJumpToLatestBtn: PropTypes.string
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
    /**
     * If true, render avatar in message feed
     */
    showAvatar: PropTypes.bool,
    /**
     * Avatar render data
     */
    avatar: PropTypes.shape({
      /**
       * If true, show avatar with message bubble
       */
      showMessageFeedAvatar: PropTypes.bool,
      /**
       * If true, show agent uploaded avatar
       * If false, show agent default avatar configured by admin
       */
      agentAvatarIsPersonalised: PropTypes.bool,
      /**
       * If true, show avatar uploaded for the bot
       * If false, show bot default avatar
       */
      botAvatarIsPersonalised: PropTypes.bool,
      /**
       * Agent default Url
       */
      agentDefaultAvatarUrl: PropTypes.string,
      /**
       * Bot default Url
       */
      botDefaultAvatarUrl: PropTypes.string,
      /**
       * Template to generate avatar url
       */
      avatarUrlTemplate: PropTypes.string,
      /**
       * App avatar Url
       */
      appAvatarUrl: PropTypes.string
    }).isRequired,
    /**
     * Object of avatar id and its last updated timestamp
     */
    avatarLastUpdatedTs: PropTypes.object.isRequired,

    /**
     * Map of attachment message id to its upload in progress status
     */
    attachmentUploadIsInProgress: PropTypes.object,
    /**
     * Current issue id
     */
    currentIssueId: PropTypes.string,
    /**
     * Current issue state
     */
    issueState: PropTypes.string,

    /**
     * Flag that tells whether the chat prompt allows user to attach files
     */
    userAttachmentsAreAllowed: PropTypes.bool.isRequired
  };

  return createReactClass({
    displayName: "ChatView",
    propTypes: {
      onMinimizeConversation: PropTypes.func,
      onKeyDown: PropTypes.func,
      onClick: PropTypes.func,
      showCloseButton: PropTypes.bool.isRequired,
      viewStyles: PropTypes.shape({
        fontFamily: PropTypes.string
      }),
      error: PropTypes.shape({
        // Error title
        title: PropTypes.string.isRequired,
        // Error subtitle
        subtitle: PropTypes.string,
        // Call to action text for the error. eg. Retry
        cta: PropTypes.string
      }),
      errorActionHandler: PropTypes.func,
      botStepInProgress: PropTypes.bool,
      keyboardInteractionIsActive: PropTypes.bool.isRequired,
      activeFooter: PropTypes.string,

      // Props common to chat view & chat view contents
      messages: PropTypes.arrayOf(MESSAGE_PROP_TYPE).isRequired,
      onSuggestedFaqClick: PropTypes.func,
      onActionClick: PropTypes.func,
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
      text: PropTypes.shape({
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
      showHeaderAvatar: PropTypes.bool.isRequired,
      appAvatarUrl: PropTypes.string,
      /**
       * If true, show agent nickname and show feed avatar only when feed avatar is enabled
       * If false, both nickname and feed avatar should not render
       * Note: Both personalisedConversationIsEnabled & showAgentNickname has same value
       */
      personalisedConversationIsEnabled: PropTypes.bool.isRequired,
      /**
       * Avatar render data
       */
      avatar: PropTypes.shape({
        /**
         * If true, show avatar with message bubble
         */
        showMessageFeedAvatar: PropTypes.bool.isRequired,
        /**
         * If true, show agent uploaded avatar
         * If false, show agent default avatar configured by admin
         */
        agentAvatarIsPersonalised: PropTypes.bool,
        /**
         * If true, show avatar uploaded for the bot
         * If false, show bot default avatar
         */
        botAvatarIsPersonalised: PropTypes.bool,
        /**
         * Agent default Url
         */
        agentDefaultAvatarUrl: PropTypes.string,
        /**
         * Bot default Url
         */
        botDefaultAvatarUrl: PropTypes.string,
        /**
         * Template to generate avatar url
         */
        avatarUrlTemplate: PropTypes.string
      }).isRequired,
      /**
       * Object of avatar id and its last updated timestamp
       */
      avatarLastUpdatedTs: PropTypes.object.isRequired,

      /**
       * Map of attachment message id to its upload in progress status
       */
      attachmentUploadIsInProgress: PropTypes.object,
      /**
       * Current issue id
       */
      currentIssueId: PropTypes.string,
      /**
       * Current issue state
       */
      issueState: PropTypes.string,

      /**
       * Flag that tells whether full privacy mode is enabled via Helpshift JS API.
       */
      fullPrivacyEnabled: PropTypes.bool,

      /**
       * Whether user attachments are enabled from dashboard config.
       */
      userAttachmentsAreEnabled: PropTypes.bool
    },

    getInitialState() {
      return {
        showJumpToLatestBtn: false,
        showNonBlockingError: false,
        blockingErrorIsVisible: false
      };
    },

    render() {
      const {
        showCloseButton,
        text,
        viewStyles,
        minimized,
        keyboardInteractionIsActive,
        onMinimizeConversation,
        onKeyDown,
        onClick,
        showHeaderAvatar,
        appAvatarUrl
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
      const viewClasses = classes("hs-view", {
        "hs-view--safari-fix": !minimized,
        "outline-hidden": !keyboardInteractionIsActive
      });

      return (
        <div className={viewClasses} style={viewStyles} onKeyDown={onKeyDown} onClick={onClick}>
          <ErrorBoundaryWithLogging onError={this._showNonBlockingError}>
            <ViewHeader
              title={text.chatViewHeader}
              showCloseBtn={showCloseButton}
              onCloseBtnClick={onMinimizeConversation}
              avatarUrl={appAvatarUrl}
              showAvatar={showHeaderAvatar}
            />
          </ErrorBoundaryWithLogging>
          {this._renderNonBlockingError()}
          {this._renderViewContents()}
        </div>
      );
    },

    _renderViewContents() {
      const {
        messages,
        onSuggestedFaqClick,
        onActionClick,
        showAgentNickname,
        isTyping,
        userIsViewingPastMessages,
        minimized,
        loadingMoreMsgsHasFailed,
        onScrollPastExistingConversation,
        onLoadMoreMessages,
        onRetryAttachmentClick,
        userInput,
        onPillOptionSelect,
        onListPickerOptionSelect,
        onSkipUserInput,
        onFilesDrop,
        text,
        hasFailure,
        unreadCount,
        latestConversationHasLoaded,
        allMessagesAreLoaded,
        pastConversationsLoading,
        loading,
        personalisedConversationIsEnabled,
        appAvatarUrl,
        avatar,
        avatarLastUpdatedTs,
        attachmentUploadIsInProgress,
        currentIssueId,
        issueState
      } = this.props;
      const avatarProps = {...avatar, ...{appAvatarUrl}};
      const avatarShouldRenderInMessageFeed =
        personalisedConversationIsEnabled && avatar.showMessageFeedAvatar;

      return (
        <ErrorBoundaryWithLogging
          fallbackComponent={<AppError />}
          onError={this._handleContentsError}>
          <ChatViewContents
            messages={messages}
            onSuggestedFaqClick={onSuggestedFaqClick}
            onActionClick={onActionClick}
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
            onPillOptionSelect={onPillOptionSelect}
            onListPickerOptionSelect={onListPickerOptionSelect}
            onSkipUserInput={onSkipUserInput}
            text={text}
            onMessageError={this._showNonBlockingError}
            onFooterError={this._showNonBlockingError}
            hasFailure={hasFailure}
            unreadCount={unreadCount}
            latestConversationHasLoaded={latestConversationHasLoaded}
            allMessagesAreLoaded={allMessagesAreLoaded}
            pastConversationsLoading={pastConversationsLoading}
            loading={loading}
            showAvatar={avatarShouldRenderInMessageFeed}
            avatar={avatarProps}
            avatarLastUpdatedTs={avatarLastUpdatedTs}
            attachmentUploadIsInProgress={attachmentUploadIsInProgress}
            currentIssueId={currentIssueId}
            issueState={issueState}
            userAttachmentsAreAllowed={this._areUserAttachmentsAllowed()}
          />
        </ErrorBoundaryWithLogging>
      );
    },

    _renderNonBlockingError() {
      if (this.state.blockingErrorIsVisible || !this.state.showNonBlockingError) {
        return null;
      }

      return <NonBlockingError />;
    },

    _handleContentsError() {
      this.setState({
        blockingErrorIsVisible: true
      });
    },

    _showNonBlockingError() {
      this.setState({
        showNonBlockingError: true
      });
    },

    /**
     * Handler for files dropped event
     * @param {Object} - files list array like object
     */
    _onFilesDrop(files) {
      this.props.onFilesDrop(files);
    },

    /**
     * Checks whether chat prompt allows user to attach files
     * @returns {boolean}
     */
    _areUserAttachmentsAllowed() {
      const {
        issueIsCreated,
        fullPrivacyEnabled,
        userAttachmentsAreEnabled,
        botStepInProgress
      } = this.props;

      return (
        issueIsCreated && !fullPrivacyEnabled && !botStepInProgress && userAttachmentsAreEnabled
      );
    },

    componentDidMount() {
      ax.setActiveView(activeViewConstants.CHAT);
    }
  });
});
