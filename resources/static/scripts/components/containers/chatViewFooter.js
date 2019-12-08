/**
 * ChatViewFooter Container.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Feb 28, 2017
 */

define("components/containers/chatViewFooter", [
  "components/chatViewFooter",
  "actions/chatView",
  "actions/actionCreators",
  "actions/appState",
  "actions/csatView",
  "actions/postSdkMessage",
  "actions/common",
  "constants/activeView",
  "constants/chatView",
  "constants/appState",
  "helpers/common"
], function(
  ChatViewFooter,
  chatViewActions,
  actionCreators,
  appStateActions,
  csatViewActions,
  postSdkMessage,
  commonActions,
  ACTIVE_VIEW,
  chatViewConstants,
  appStateConstants,
  commonHelpers
) {
  "use strict";

  const {MAX_POLLER_FAILURES_ALLOWED} = chatViewConstants;
  const {APP_RESET_TRIGGER} = appStateConstants;

  const mapStateToProps = (state) => {
    const {
      appState: {
        minimized: widgetIsMinimized,
        activeIssueId,
        issueType,
        footerIsActive,
        fullPrivacyEnabled,
        online,
        browserIsMobile,
        featuresEnabled: {userAttachments: userAttachmentsEnabled}
      },
      chatView: {
        userInput,
        activeFooter,
        userIsRedacted,
        pollerFailureCount,
        userIsViewingPastMessages,
        unreadMessageIds,
        error,
        botState: {botStepInProgress}
      },
      csatView: {rating},
      ui: {text}
    } = state;

    let failureConfig;

    if (error && error.title) {
      failureConfig = {
        message: error.title,
        allowRetry: true
      };
    } else if (!online) {
      failureConfig = {
        message: text.noInternetConnection
      };
    } else if (userIsRedacted) {
      failureConfig = {
        message: text.userRedactionMessage
      };
    } else if (pollerFailureCount >= MAX_POLLER_FAILURES_ALLOWED) {
      failureConfig = {
        message: text.unknownErrorReconnecting,
        // @TODO: Confirm whether to show loading icon from design
        isLoading: true
      };
    }

    return {
      widgetIsMinimized,
      rating,
      activeFooter: activeFooter,
      issueIsCreated: commonHelpers.isIssueCreated({
        activeIssueId,
        issueType
      }),
      text: text,
      footerIsActive: footerIsActive,
      userInput,
      fullPrivacyEnabled,
      userIsViewingPastMessages,
      userAttachmentsEnabled,
      unreadCount: unreadMessageIds.length,
      failureConfig,
      botStepInProgress,
      browserIsMobile
    };
  };

  const mapDispatchToProps = (dispatch) => {
    return {
      onValueChangeInputField: (value) => {
        dispatch(chatViewActions.updateReplyText(value));
      },
      onStarClick: (updatedRating) => {
        dispatch(csatViewActions.updateCsatRating(updatedRating));
        dispatch(actionCreators.updateActiveView(ACTIVE_VIEW.CSAT));
      },
      onUpdateStarRating: (updatedRating) => {
        dispatch(csatViewActions.updateCsatRating(updatedRating));
      },
      onSelectStarRating: () => {
        dispatch(actionCreators.updateActiveView(ACTIVE_VIEW.CSAT));
      },
      onFooterFocus: () => {
        dispatch(actionCreators.setFooterActive());
      },
      onFooterBlur: () => {
        dispatch(actionCreators.setFooterInactive());
      },
      onAcceptResolutionQuestionClick: () => {
        dispatch(chatViewActions.acceptResolutionQuestion());
      },
      onRejectResolutionQuestionClick: () => {
        dispatch(chatViewActions.rejectResolutionQuestion());
      },
      onStartNewConversation: () => {
        // We need to just call app reset as it will clear all the store data and
        // call getConfig. Once getConfig is called, it will initialize the
        // conversation and will take care of creating new preIssue.
        // Ref :- App state actions -> initializeConversation
        dispatch(
          commonActions.reloadApp({
            loading: true,
            trigger: APP_RESET_TRIGGER.START_NEW_CONVERSATION,
            callback: chatViewActions.stopPollingForMessages
          })
        );
      },
      onSkipUserInput: () => {
        dispatch(chatViewActions.skipUserInput());
      },
      onSubmitReply: () => {
        dispatch(chatViewActions.submitReply());
      },
      onFilesChange: (files) => {
        dispatch(chatViewActions.createAttachmentMessages(files));
      },
      onCloseConversation: () => {
        dispatch(postSdkMessage.chatEndEvent());
        dispatch(appStateActions.toggleMinimized(true));
      },
      onListPickerToggleStateChange: (toggleState) => {
        dispatch(actionCreators.updateListPickerToggleState(toggleState));
      }
    };
  };

  return ReactRedux.connect(mapStateToProps, mapDispatchToProps)(ChatViewFooter);
});
