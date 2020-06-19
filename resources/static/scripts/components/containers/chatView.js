/**
 * ChatView Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define("components/containers/chatView", [
  "components/chatView",
  "actions/chatView",
  "actions/faqView",
  "helpers/common",
  "constants/chatView"
], function(ChatView, chatViewActions, faqViewActions, commonHelpers, chatViewConstants) {
  "use strict";

  const {MAX_POLLER_FAILURES_ALLOWED} = chatViewConstants;

  const mapStateToProps = (state) => {
    const {
      appState: {
        featuresEnabled: {personalisedConversationIsEnabled},
        activeIssueId,
        issueType,
        minimized,
        online,
        showHeaderAvatar,
        appAvatarUrl,
        avatar
      },
      chatView: {
        messageList: messages,
        systemTyping,
        agentTyping,
        userInput,
        pollerFailureCount,
        loading,
        error,
        userIsViewingPastMessages,
        loadingMoreMsgsHasFailed,
        pastConversationsLoading,
        latestConversationHasLoaded,
        unreadMessageIds,
        allMessagesAreLoaded,
        botState: {botStepInProgress},
        activeFooter,
        avatarLastUpdatedTs
      },
      ui: {text}
    } = state;

    const hasFailure = !online || pollerFailureCount >= MAX_POLLER_FAILURES_ALLOWED;

    // @TODO: In future, we should pass unreadMessageIds so that individual
    // message IDs can be marked as read
    return {
      messages,
      minimized,
      isTyping: systemTyping || agentTyping,
      showAgentNickname: personalisedConversationIsEnabled,
      personalisedConversationIsEnabled,
      text: text,
      issueIsCreated: commonHelpers.isIssueCreated({
        activeIssueId,
        issueType
      }),
      userInput,
      loading,
      hasFailure,
      error,
      latestConversationHasLoaded,
      userIsViewingPastMessages,
      loadingMoreMsgsHasFailed,
      unreadCount: unreadMessageIds.length,
      pastConversationsLoading,
      allMessagesAreLoaded,
      botStepInProgress,
      activeFooter,
      showHeaderAvatar,
      appAvatarUrl,
      avatar,
      avatarLastUpdatedTs
    };
  };

  const mapDispatchToProps = (dispatch) => {
    return {
      onSuggestedFaqClick: (faqId, language, msgId, faqSource) => {
        dispatch(faqViewActions.getFaq(faqId, language, msgId, faqSource));
      },
      onActionClick: (actionData) => {
        dispatch(chatViewActions.trackActionClickEvent(actionData));
      },
      onFilesDrop: (files) => {
        dispatch(chatViewActions.createAttachmentMessages(files));
      },
      onRetryAttachmentClick: (message) => {
        dispatch(chatViewActions.createAttachmentMessage(message.file, message.id));
      },
      onScrollPastExistingConversation: (userHasScrolledToPastConvs) => {
        chatViewActions.handleScrollPastExistingConversation(userHasScrolledToPastConvs);
      },
      onLoadMoreMessages: () => {
        chatViewActions.loadMoreMessages();
      },
      onPillOptionSelect: (option) => {
        dispatch(chatViewActions.setUserSelectedOption(option));
        dispatch(chatViewActions.submitReply());
      },
      errorActionHandler: () => {
        dispatch(chatViewActions.handleErrorAction());
      },
      onSkipUserInput: () => {
        dispatch(chatViewActions.skipUserInput());
      },
      onListPickerOptionSelect: (option) => {
        dispatch(chatViewActions.setUserSelectedOption(option));
        dispatch(chatViewActions.submitReply());
      }
    };
  };

  return ReactRedux.connect(mapStateToProps, mapDispatchToProps)(ChatView);
});
