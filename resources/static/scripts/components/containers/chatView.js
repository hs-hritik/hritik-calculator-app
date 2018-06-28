/**
 * ChatView Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/containers/chatView",
  [
    "components/chatView",
    "actions/chatView",
    "actions/faqView",
    "helpers/common",
    "constants/chatView"
  ],
  function (ChatView, chatViewActions, faqViewActions, commonHelpers,
    chatViewConstants) {
    "use strict";

    const {MAX_POLLER_FAILURES_ALLOWED} = chatViewConstants;

    const mapStateToProps = (state) => {
      const {
        appState: {
          featuresEnabled: {
            agentNickname
          },
          activeIssueId,
          issueType,
          online
        },
        chatView: {
          messageList: messages,
          systemTyping,
          agentTyping,
          userInput,
          pollerFailureCount,
          loading,
          error,
          userIsViewingPastMessages,
          pastConversationsLoading,
          allMessagesAreLoaded
        },
        ui: {
          text
        }
      } = state;

      const hasFailure = !online || (pollerFailureCount >= MAX_POLLER_FAILURES_ALLOWED);

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
        loading,
        hasFailure,
        error,
        userIsViewingPastMessages,
        pastConversationsLoading,
        allMessagesAreLoaded
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onSuggestedFaqClick: (faqId, language) => {
          dispatch (faqViewActions.getFaq (faqId, language));
        },
        onFilesDrop: (files) => {
          dispatch (chatViewActions.createAttachmentMessages (files));
        },
        onRetryAttachmentClick: (message) => {
          dispatch (
            chatViewActions.createAttachmentMessage (message.file, message.id)
          );
        },
        onScrollPastExistingConversation: (isViewing) => {
          dispatch (
            chatViewActions.setUserIsViewingPastMessages (isViewing)
          );
        },
        onPillOptionSelect: (option) => {
          dispatch (chatViewActions.setUserSelectedOption (option));
          dispatch (chatViewActions.submitReply ());
        },
        errorActionHandler: () => {
          dispatch (chatViewActions.handleErrorAction ());
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatView);
  }
);
