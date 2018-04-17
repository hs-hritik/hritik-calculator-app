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
    "helpers/common"
  ],
  function (ChatViewFooter, chatViewActions, actionCreators, appStateActions,
    csatViewActions, ACTIVE_VIEW, commonHelpers) {
    "use strict";

    const mapStateToProps = (state) => {
      const {
        appState: {
          activeIssueId,
          issueType,
          footerIsActive,
          fullPrivacyEnabled,
          online
        },
        chatView: {
          userInput,
          activeFooter
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
        failureConfig
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onValueChangeInputField: (value) => {
          dispatch (chatViewActions.updateUserInputData ({
            value,
            errorMsg: ""
          }));
        },
        onStarClick: (updatedRating) => {
          dispatch (csatViewActions.updateCsatRating (updatedRating));
          dispatch (actionCreators.updateActiveView (ACTIVE_VIEW.CSAT));
        },
        onFooterFocus: () => {
          dispatch (appStateActions.setFooterActive ());
        },
        onFooterBlur: () => {
          dispatch (appStateActions.setFooterInactive ());
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
          dispatch (appStateActions.reset ({
            skipUser: true
          }));
          dispatch (actionCreators.toggleLoading (true));
        },
        onSkipUserInput: () => {
          dispatch (chatViewActions.updateUserInputData ({
            skipped: true
          }));
          dispatch (chatViewActions.submitReply ());
        },
        onSubmitReply: () => {
          dispatch (chatViewActions.submitReply ());
        },
        onFilesChange: (files) => {
          dispatch (chatViewActions.createAttachmentMessages (files));
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatViewFooter);
  }
);
