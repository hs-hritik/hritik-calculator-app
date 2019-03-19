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
          minimized,
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
          latestConversationHasLoaded,
          unreadMessageIds,
          allMessagesAreLoaded,
          botState: {
            botStepInProgress
          }
        },
        ui: {
          text
        }
      } = state;

      const hasFailure = !online || (pollerFailureCount >= MAX_POLLER_FAILURES_ALLOWED);

      // @TODO: In future, we should pass unreadMessageIds so that individual
      // message IDs can be marked as read
      return {
        messages,
        minimized,
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
        latestConversationHasLoaded,
        userIsViewingPastMessages,
        unreadCount: unreadMessageIds.length,
        pastConversationsLoading,
        allMessagesAreLoaded,
        botStepInProgress
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
        onScrollPastExistingConversation: (userHasScrolledToPastConvs) => {
          chatViewActions.handleScrollPastExistingConversation (userHasScrolledToPastConvs);
        },
        onLoadMoreMessages: () => {
          chatViewActions.loadMoreMessages ();
        },
        onPillOptionSelect: (option) => {
          dispatch (chatViewActions.setUserSelectedOption (option));
          dispatch (chatViewActions.submitReply ());
        },
        errorActionHandler: () => {
          dispatch (chatViewActions.handleErrorAction ());
        },
        onSkipUserInput: () => {
          dispatch (chatViewActions.skipUserInput ());
        },
        onListPickerOptionSelect: (option) => {
          dispatch (chatViewActions.setUserSelectedOption (option));
          dispatch (chatViewActions.submitReply ());
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatView);
  }
);
