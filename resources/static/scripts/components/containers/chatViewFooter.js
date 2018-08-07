/**
 * ChatViewFooter Container.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Feb 28, 2017
 */

define ("components/containers/chatViewFooter",
  [
    "components/chatViewFooter",
    "actions/chatView",
    "actions/actionCreators",
    "actions/appState",
    "actions/csatView",
    "constants/activeView",
    "constants/chatView",
    "constants/appState",
    "helpers/common",
    "extras/postSdkMessage"
  ],
  function (ChatViewFooter, chatViewActions, actionCreators, appStateActions,
    csatViewActions, ACTIVE_VIEW, chatViewConstants, appStateConstants,
    commonHelpers, postSdkMessage) {
    "use strict";

    const {MAX_POLLER_FAILURES_ALLOWED} = chatViewConstants;
    const {APP_RESET_TRIGGER} = appStateConstants;

    const mapStateToProps = (state) => {
      const {
        appState: {
          activeIssueId,
          issueType,
          footerIsActive,
          fullPrivacyEnabled,
          online,
          browserIsMobile,
          featuresEnabled: {
            userAttachments: userAttachmentsEnabled
          }
        },
        chatView: {
          userInput,
          activeFooter,
          userIsRedacted,
          pollerFailureCount,
          userIsViewingPastMessages,
          unreadMessageIds,
          botState: {
            botStepInProgress
          }
        },
        csatView: {
          rating
        },
        ui: {
          text
        }
      } = state;

      let failureConfig;

      if (!online) {
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
        rating,
        activeFooter: activeFooter,
        issueIsCreated: commonHelpers.isIssueCreated ({
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
          dispatch (chatViewActions.updateReplyText (value));
        },
        onStarClick: (updatedRating) => {
          dispatch (csatViewActions.updateCsatRating (updatedRating));
          dispatch (actionCreators.updateActiveView (ACTIVE_VIEW.CSAT));
        },
        onFooterFocus: () => {
          dispatch (actionCreators.setFooterActive ());
        },
        onFooterBlur: () => {
          dispatch (actionCreators.setFooterInactive ());
        },
        onAcceptResolutionQuestionClick: () => {
          dispatch (chatViewActions.acceptResolutionQuestion ());
        },
        onRejectResolutionQuestionClick: () => {
          dispatch (chatViewActions.rejectResolutionQuestion ());
        },
        onStartNewConversation: () => {
          // We need to just call reset as it will clear all the store data and
          // call getConfig. Once getConfig is called, it will initialize the
          // conversation and will take care of creating new preIssue.
          // Ref :- App state actions -> initializeConversation
          dispatch (
            appStateActions.setAppResetTrigger (
              APP_RESET_TRIGGER.START_NEW_CONVERSATION
            )
          );
          dispatch (appStateActions.reset ());
          dispatch (actionCreators.toggleChatViewLoading (true));
        },
        onSkipUserInput: () => {
          dispatch (chatViewActions.skipUserInput ());
        },
        onSubmitReply: () => {
          dispatch (chatViewActions.submitReply ());
        },
        onFilesChange: (files) => {
          dispatch (chatViewActions.createAttachmentMessages (files));
        },
        onCloseConversation: () => {
          postSdkMessage.chatEndEvent ();
          dispatch (appStateActions.toggleMinimized (true));
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatViewFooter);
  }
);
