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
    "constants/appState"
  ],
  function (ChatViewFooter, chatViewActions, actionCreators, appStateActions,
    csatViewActions, ACTIVE_VIEW, appStateConstants) {
    "use strict";

    const {ISSUE_TYPE} = appStateConstants;

    const mapStateToProps = (state) => {
      const {
        appState: {
          activeIssueId,
          issueType,
          footerIsActive,
          fullPrivacyEnabled
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

      return {
        rating,
        activeFooter: activeFooter,
        issueIsCreated: !!activeIssueId && issueType !== ISSUE_TYPE.PRE_ISSUE,
        text: text,
        footerIsActive: footerIsActive,
        userInput,
        fullPrivacyEnabled
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onValueChangeInputField: (value) => {
          dispatch (chatViewActions.updateUserInputData ({
            value,
            error: false,
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
          dispatch (appStateActions.reset ());
          appStateActions.startConversation ();
        },
        onPillOptionSelect: (option) => {
          dispatch (chatViewActions.setUserSelectedOption (option));
          dispatch (chatViewActions.submitReply ());
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
