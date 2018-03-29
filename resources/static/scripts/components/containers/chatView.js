/**
 * ChatView Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/containers/chatView",
  [
    "components/chatView",
    "helpers/entitySchema",
    "actions/chatView",
    "actions/faqView"
  ],
  function (ChatView, entitySchema, chatViewActions, faqViewActions) {
    "use strict";

    const mapStateToProps = (state) => {
      const {
        appState: {
          featuresEnabled: {
            agentNickname
          }
        },
        chatView: {
          messageList: messages,
          systemTyping,
          agentTyping
        },
        ui: {
          text
        }
      } = state;

      return {
        messages,
        isTyping: systemTyping || agentTyping,
        showAgentNickname: agentNickname,
        text: text,
        issueIsCreated: !!state.appState.activeIssueId
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onSuggestedFaqClick: (faqId) => {
          dispatch (faqViewActions.getFaq (faqId));
        },
        onFilesDrop: (files) => {
          dispatch (chatViewActions.createAttachmentMessages (files));
        },
        onRetryAttachmentClick: (message) => {
          dispatch (
            chatViewActions.createAttachmentMessage (message.file, message.id)
          );
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatView);
  }
);
