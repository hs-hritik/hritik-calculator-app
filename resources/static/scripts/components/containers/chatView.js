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
    "actions/faqView",
    "helpers/common"
  ],
  function (ChatView, entitySchema, chatViewActions, faqViewActions, commonHelpers) {
    "use strict";

    const mapStateToProps = (state) => {
      const {
        appState: {
          featuresEnabled: {
            agentNickname
          },
          activeIssueId,
          issueType,
          loading
        },
        chatView: {
          messageList: messages,
          systemTyping,
          agentTyping,
          userInput
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
        issueIsCreated: commonHelpers.isIssueCreated ({
          activeIssueId,
          issueType
        }),
        userInput,
        loading
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
        },
        onPillOptionSelect: (option) => {
          dispatch (chatViewActions.setUserSelectedOption (option));
          dispatch (chatViewActions.submitReply ());
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatView);
  }
);
