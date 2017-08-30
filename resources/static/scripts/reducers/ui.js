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
        greetingMsg: "Hi, how can we help you?",
        faqSuggestionsAdditionalHelpMsg: "Do you still want to talk to an agent?",
        faqSuggestionsAdditionalHelpRequiredBtn: "Yes",  // Also used for msg
        faqSuggestionsAdditionalHelpNotRequiredBtn: "No",  // Also used for msg
        problemSolvedByFaqSuggestionsMsg: "Glad we could help you!",
        faqSuggestionsMsgTitleSingle: "See if this article helps",
        faqSuggestionsMsgTitleMultpile: "See if these articles help",
        faqViewHeader: "Back",
        closeConversationBtn: "Close",
        replyBtnPlaceholder: "Write your message",
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
