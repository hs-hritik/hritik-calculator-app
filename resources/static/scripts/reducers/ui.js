/**
 * UI reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/ui",
  ["constants/actionTypes"],
  function (ACTION_TYPES) {
    "use strict";

    const update = React.addons.update;

    const INITIAL_STATE = {
      text: {
        chatViewHeader: "Chat with us",
        greetingMsg: "Hi! How can I help you today?",
        createIssueUserMessage: "No, I want to talk to an agent.",
        problemSolvedAgentMessage: "Did we answer all of your questions?",
        faqMessageHeader: "Do these FAQs solve your problem?",
        faqSuggestionsAdditionalHelpMessage: "Do you still need additional help from an agent?",
        faqSuggestionsAdditionalHelpRequiredBtn: "Yes",
        faqSuggestionsAdditionalHelpNotRequiredBtn: "No",
        problemSolvedByFaqSuggestionsMessage: "Glad I could help you today",
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
        replyBtnPlaceholder: "Send a message...",
        csatBotRequestMsg: "Thanks! Would you like to fill this?",
        csatBotFormMsg: "Your feedback helps us improve"
      },
      color: {
        primary: "#43BF6C"
      }
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.SET_WM_CONFIG:
          const {config} = action;

          return update (state, {
            text: {
              greetingMsg: {$set: config.greeting_msg},
              chatViewHeader: {$set: config.appearance.widget_title},
              csatBotRequestMsg: {$set: config.csat_bot.req_msg},
              csatBotFormMsg: {$set: config.csat_bot.form_msg}
            },
            color: {
              primary: {$set: config.appearance.primary_color}
            }
          });

        default:
          return state;
      }
    };
  }
);
