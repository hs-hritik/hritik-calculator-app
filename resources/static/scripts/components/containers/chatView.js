/**
 * ChatView Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/containers/chatView",
  [
    "normalizr",
    "components/chatView",
    "helpers/entitySchema"
  ],
  function (normalizr, ChatView, entitySchema) {
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

    return ReactRedux.connect (mapStateToProps) (ChatView);
  }
);
