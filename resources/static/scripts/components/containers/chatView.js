/**
 * ChatView Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/containers/chatView",
  [
    "normalizr",
    "helpers/entitySchema",
    "actions/faqView",
    "components/chatView"
  ],
  function (normalizr, entitySchema, faqViewActions, ChatView) {
    "use strict";

    const {denormalize} = normalizr;

    const mapStateToProps = (state) => {
      const issueId = state.appState.activeIssueId || state.appState.dummyIssueId;
      const issue = denormalize (issueId, entitySchema.issue, state.entities);
      const messages = issue ? issue.messages : [];

      return {
        messages,
        activeFooter: state.chatView.activeFooter,
        text: state.ui.text
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onSuggestedFaqClick: (faqId) => {
          dispatch (faqViewActions.getFaq (faqId));
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatView);
  }
);
