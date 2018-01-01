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
        csatBotFormSubmitBtn: "Submit",
        csatBotReviewPlaceholder: "Leave us additional feedback",
        csatBotReviewTitle: "Additional Feedback",
        csatViewHeader: "Chat with us",
        infoBotRequestMsg: "Before we begin, we need some more information.",
        timeAgoJustNow: "just now",
        branding: "Powered by Helpshift",
        attachmentUploadingStatus: "Uploading..",
        attachmentRetryError: "Error. Click  to retry.",
        attachmentFileSizeError: "Attachment exceeds limit of 25MB",
        attachmentDefaultError: "Error. Failed to upload attachment.",
        businessHoursNameLabel: "Name",
        businessHoursEmailLabel: "Email",
        businessHoursMessageLabel: "Message",
        businessHoursNamePlaceholder: "Enter your name",
        businessHoursEmailPlaceholder: "john@example.com",
        businessHoursMessagePlaceholder: "Write your message",
        businessHoursSubmitBtn: "Submit",
        businessHoursThankYouMessage: "Thanks for reaching out. We will get " +
                                      "back to you soon.",
        businessHoursViewHeader: "",
        businessHoursContactFormMessage: "",
        businessHoursOfflineMessage: "",
        dndInfoText: "Add files or drag here",
        businessHoursAttachmentsSizeExceedMsg: "Total size of attachments exceed 25MB",
        businessHoursAttachmentsLimitExceedMsg: "Attachment exceeds maximum limit of 5"
      },
      color: {
        primary: "#43BF6C"
      }
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.SET_WM_CONFIG:
          const {config} = action;

          const textUpdateObj = {
            greetingMsg: {$set: config.greeting},
            chatViewHeader: {$set: config.appearance.widget_title},
            csatViewHeader: {$set: config.appearance.widget_title},
            csatBotRequestMsg: {$set: config.csat_bot.req_msg}
          };
          const businessHoursEnabled = config.business_hours_enabled;

          if (businessHoursEnabled) {
            const businessHours = config.business_hours;
            textUpdateObj.businessHoursViewHeader = {
              $set: businessHours.offline_title
            };
            textUpdateObj.businessHoursContactFormMessage = {
              $set: businessHours.cf_message
            };
            textUpdateObj.businessHoursOfflineMessage = {
              $set: businessHours.offline_message
            };
          }

          return update (state, {
            text: textUpdateObj,
            color: {
              primary: {$set: config.appearance.primary_color}
            }
          });

        case ACTION_TYPES.SET_GREETING_MESSAGE:
          return update (state, {
            text: {
              greetingMsg: {$set: action.message}
            }
          });

        default:
          return state;
      }
    };
  }
);
