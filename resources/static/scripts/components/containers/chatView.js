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
    appStateActions, CHAT_VIEW_CONSTANTS) {
    "use strict";

    const {denormalize} = normalizr;
    const {ACTIVE_FOOTER} = CHAT_VIEW_CONSTANTS;

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
            dispatch (chatViewActions.setChatViewFooter (ACTIVE_FOOTER.NEW_CONVERSATION));
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
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatView);
  }
);
