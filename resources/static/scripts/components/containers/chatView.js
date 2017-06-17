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
    "actions/faqView"
  ],
  function (normalizr, ChatView, entitySchema, chatViewActions, faqViewActions) {
    "use strict";

    const {denormalize} = normalizr;

    const mapStateToProps = (state) => {
      const issueId = state.appState.activeIssueId || state.appState.dummyIssueId;
      const issue = denormalize (issueId, entitySchema.issue, state.entities);
      const messages = issue ? issue.messages : [];

      return {
        messages,
        activeFooter: state.chatView.activeFooter,
        csatRating: state.chatView.csatRating,
        text: state.ui.text
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onSuggestedFaqClick: (faqId) => {
          dispatch (faqViewActions.getFaq (faqId));
        },
        onFaqSuggestionFeedback: (feedback) => {
          if (feedback === "no") {
            dispatch (chatViewActions.createIssue ());
          } else {
            // @TODO: Confirm UX
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
          // @TODO: Dispatch action to start new conversation.
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatView);
  }
);
