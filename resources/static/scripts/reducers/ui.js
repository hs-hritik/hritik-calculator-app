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
        faqSuggestionsAdditionalHelpMessage: "Do you still need additional help from an agent?",
        faqSuggestionsAdditionalHelpRequiredBtn: "Yes",
        faqSuggestionsAdditionalHelpNotRequiredBtn: "No",
        problemSolvedByFaqSuggestionsMessage: "Glad I could help you today.",
        faqSuggestionsMsgTitleSingle: "Does this FAQ solve your problem?",
        faqSuggestionsMsgTitleMultpile: "Do these FAQs solve your problem?",
        faqViewHeader: "Back",
        closeConversationBtn: "Close",
        replyBtn: "Send",
        replyBtnPlaceholder: "Send a message...",
        csatBotRequestMsg: "Do you have a moment to rate your experience?",
        csatBotResponseMsg: "Thanks for your feedback!",
        csatBotFormRequestMsg: "How would you rate your chat experience?",
        csatBotFormSubmitBtn: "Submit",
        csatBotReviewPlaceholder: "Leave us additional feedback",
        csatBotReviewTitle: "Additional Feedback",
        csatLinkCaption: "Take Survey",
        csatViewHeader: "Chat with us",
        infoBotRequestMsg: "Before we begin, we need some more information.",
        branding: "Powered by Helpshift"
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
              greetingMsg: {$set: config.greeting},
              chatViewHeader: {$set: config.appearance.widget_title},
              csatViewHeader: {$set: config.appearance.widget_title},
              csatBotRequestMsg: {$set: config.csat_bot.req_msg}
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
