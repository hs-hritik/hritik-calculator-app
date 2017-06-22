/**
 * UI reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/ui",
  function () {
    "use strict";

    const INITIAL_STATE = {
      text: {
        chatViewHeader: "Chat with us",
        defaultAgentMessage: "Hi. How may we help you today?",
        createIssueUserMessage: "No, I want to talk to an agent.",
        problemSolvedAgentMessage: "Did we answer all of your questions?",
        faqMessageHeader: "Do these FAQs solve your problem?",
        faqSuggestionsHelpful: "Yes, they were helpful",
        faqSuggestionsNotHelpful: "No, I want to talk to an agent",
        faqSuggestionsMsgTitle: "Do these FAQs solve your problem?",
        problemSolved: "Yes, Thanks!",
        problemNotSolved: "No",
        faqViewHeader: "Back to messages",
        faqFooter: "Was this helpful?",
        faqFooterHelpfulBtn: "Yes",
        faqFooterNotHelpfulBtn: "No",
        acceptSolutionMessage: "Accepted the solution",
        rejectSolutionMessage: "Rejected the solution",
        csatReviewRequest: "What's your feedback about our customer support?",
        csatReviewResponse: "Thanks for your feedback!",
        startNewConversationBtn: "Start a new conversation",
        replyBtn: "Send",
        replyBtnPlaceholder: "Send a message..."
      }
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        default:
          return state;
      }
    };
  }
);
