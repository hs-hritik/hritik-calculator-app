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
  "helpers/analytics",
  "utils/color",
  "constants/uiConfig"
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
  analyticsHelpers,
  colorUtils,
  UI_CONFIG_CONSTANTS
) {
  "use strict";

  const {MAX_POLLER_FAILURES_ALLOWED} = chatViewConstants;
  const {EVENT} = analyticsConstants;
  const {
    FLATTENED_UI_CONFIG: {CHAT_WIDGET_BG_COLOR, FORM_BG_COLOR}
  } = UI_CONFIG_CONSTANTS;

  const mapStateToProps = (state) => {
    const {
      appState: {
        minimized: widgetIsMinimized,
        activeIssueId,
        issueType,
        footerIsActive,
        online,
        browserIsMobile,
        attachmentsWhitelist,
        featuresEnabled: {intents: intentsFeatureIsEnabled},
        liteSdkConfig: {os}
      },
      chatView: {
        userInput,
        activeFooter,
        userIsRedacted,
        pollerFailureCount,
        userIsViewingPastMessages,
        unreadMessageIds,
        error,
        intents,
        userReplyXhrInProgress,
        systemTyping
      },
      csatView: {rating},
      ui: {
        text,
        uiConfig: {
          [CHAT_WIDGET_BG_COLOR]: {value: chatWidgetBgColor},
          [FORM_BG_COLOR]: {value: formBgColor}
        }
      }
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
        message: text.userRedactionMessage,
        allowRetry: true
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
      userIsViewingPastMessages,
      unreadCount: unreadMessageIds.length,
      failureConfig,
      browserIsMobile,
      intentsFeatureIsEnabled,
      issueType,
      attachmentsWhitelist,
      liteSdkOs: os,
      userReplyXhrInProgress,
      systemTyping,
      chatWidgetBgColor,
      formBgColor
    };

    if (intentsFeatureIsEnabled) {
      props.intents = {
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
      onChangeReplyBoxValue: (value) => {
        dispatch(chatViewActions.updateReplyTextAndSearchIntents(value));
      },
      onAcceptResolutionQuestionClick: () => {
        dispatch(chatViewActions.acceptResolutionQuestion());
      },
      onRejectResolutionQuestionClick: () => {
        dispatch(chatViewActions.rejectResolutionQuestion());
      },
      onStartNewConversation: () => {
        dispatch(
          appStateActions.startNewConversation({
            resetSessionId: true
          })
        );
        analyticsHelpers.track(EVENT.WIDGET_OPEN);
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
      },
      onStopIntentsSearch: () => {
        dispatch(actionCreators.stopIntentsSearch());
      },
      onRetry: () => {
        dispatch(appStateActions.handleChatViewFooterRetry());
      },
      onSystemType: (safeAreaColor) => {
        dispatch(
          postSdkMessage.sendSafeAreaColorToLiteSdk({
            safeAreaColor: colorUtils.convertThreeToSixCharHexColorCode(safeAreaColor)
          })
        );
      }
    };
  };

  return ReactRedux.connect(mapStateToProps, mapDispatchToProps)(ChatViewFooter);
});
