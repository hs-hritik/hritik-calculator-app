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
  "constants/activeView",
  "constants/chatView",
  "constants/analytics",
  "helpers/common",
  "helpers/analytics"
], function(
  ChatViewFooter,
  chatViewActions,
  actionCreators,
  appStateActions,
  csatViewActions,
  postSdkMessage,
  ACTIVE_VIEW,
  chatViewConstants,
  analyticsConstants,
  commonHelpers,
  analyticsHelpers
) {
  "use strict";

  const {MAX_POLLER_FAILURES_ALLOWED} = chatViewConstants;
  const {EVENT} = analyticsConstants;

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
        featuresEnabled: {userAttachments: userAttachmentsEnabled, intents: intentsFeatureIsEnabled}
      },
      chatView: {
        userInput,
        activeFooter,
        userIsRedacted,
        pollerFailureCount,
        userIsViewingPastMessages,
        unreadMessageIds,
        error,
        botState: {botStepInProgress},
        intents
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

    const props = {
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
      browserIsMobile,
      intentsFeatureIsEnabled,
      issueType
    };

    if (intentsFeatureIsEnabled) {
      props.intent = {
        intentsMap: intents.tree.intentsMap,
        topLevelIntentsOrder: intents.tree.topLevelIntentsOrder,
        selectedIntentIds: intents.selectedIntentIds,
        isSearching: intents.isSearching,
        searchResultIntentIds: intents.searchResultIntents.map(({intentId}) => intentId),
        enforceIntentSelection: intents.enforceIntentSelection,
        pickerNavigationState: intents.pickerNavigationState
      };
    }

    return props;
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
        dispatch(appStateActions.startNewConversation());
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
      onListPickerNavigationStateChange: (navigationState) => {
        dispatch(actionCreators.updateListPickerNavigationState(navigationState));
      },
      onIntentsNavigationStateChange: (navigationState) => {
        dispatch(actionCreators.updateIntentsNavigationState(navigationState));
      },
      onSelectIntent: (intent) => {
        dispatch(chatViewActions.selectIntent(intent));
      },
      onUnselectIntent: () => {
        dispatch(actionCreators.intentUnselected());
        analyticsHelpers.track(EVENT.INTENT_UNSELECTED);
      }
    };
  };

  return ReactRedux.connect(mapStateToProps, mapDispatchToProps)(ChatViewFooter);
});
