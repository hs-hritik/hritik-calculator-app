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
    "constants/chatView"
  ],
  function (ChatViewFooter, chatViewActions, actionCreators, appStateActions,
    csatViewActions, ACTIVE_VIEW) {
    "use strict";

    const mapStateToProps = (state) => {
      const {
        chatView: {
          userInput
        },
        csatView: {
          rating
        }
      } = state;

      return {
        rating,
        activeFooter: state.chatView.activeFooter,
        text: state.ui.text,
        footerIsActive: state.appState.footerIsActive,
        userInput
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onFaqSuggestionFeedback: (feedbackHelpful) => {
          if (feedbackHelpful) {
            dispatch (chatViewActions.acceptFaqSuggestions ());
          } else {
            dispatch (chatViewActions.rejectFaqSuggestions ());
          }
        },
        onValueChangeInputField: (value) => {
          dispatch (chatViewActions.updateUserInputData ({
            value,
            error: false,
            errorMsg: ""
          }));
        },
        onSubmitInputField: () => {
          dispatch (chatViewActions.submitReply ());
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
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatViewFooter);
  }
);
