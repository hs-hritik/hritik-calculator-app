/**
 * ChatView Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/containers/chatView",
  [
    "normalizr",
    "components/chatView",
    "helpers/entitySchema",
    "actions/chatView",
    "actions/faqView",
    "actions/appState",
    "constants/chatView"
  ],
  function (normalizr, ChatView, entitySchema, chatViewActions, faqViewActions,
    appStateActions) {
    "use strict";

    const {denormalize} = normalizr;

    const mapStateToProps = (state) => {
      const issueId = state.appState.activeIssueId || state.appState.dummyIssueId;
      const issue = denormalize (issueId, entitySchema.issue, state.entities);
      const messages = issue ? issue.messages : [];
      const {getInfoBot} = state.chatView;

      return {
        messages,
        activeFooter: state.chatView.activeFooter,
        csatRating: state.chatView.csatRating,
        isTyping: state.chatView.systemTyping || state.chatView.agentTyping,
        getInfoField: getInfoBot.data [getInfoBot.currentField],
        text: state.ui.text
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onSuggestedFaqClick: (faqId) => {
          dispatch (faqViewActions.getFaq (faqId));
        },
        onFaqSuggestionFeedback: (feedbackHelpful) => {
          if (feedbackHelpful) {
            dispatch (chatViewActions.acceptFaqSuggestions ());
          } else {
            dispatch (chatViewActions.rejectFaqSuggestions ());
          }
        },
        onIssueFeedback: (feedback) => {
          if (feedback === "no") {
            dispatch (chatViewActions.rejectSolution ());
          } else {
            dispatch (chatViewActions.acceptSolution ());
          }
        },
        onSubmitCsatRating: (rating) => {
          dispatch (chatViewActions.submitCsat (rating));
        },
        onStartNewConversation: () => {
          dispatch (appStateActions.startNewConversation ());
        },
        onValueChangeGetInfoField: (value) => {
          dispatch (chatViewActions.updateGetInfoFieldValue (value));
        },
        onSubmitGetInfoField: () => {
          dispatch (chatViewActions.submitGetInfoField ());
        },
        onCloseConversation: () => {
          // @TODO: Call action to reset conversation (when done),
          // and call event to minimize the wm.
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatView);
  }
);
