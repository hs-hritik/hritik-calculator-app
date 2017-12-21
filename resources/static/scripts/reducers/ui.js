/**
 * UI reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/ui",
  [
    "constants/actionTypes",
    "constants/uiConfig",
    "helpers/ui"
  ],
  function (ACTION_TYPES, UI_CONFIG_CONSTANTS, uiHelpers) {
    "use strict";

    const update = React.addons.update;
    const {
      DEFAULT_UI_CONFIG,
      PRIMARY_COLOR,
      PRIMARY_COLOR_DARK,
      PRIMARY_COLOR_LIGHT
    } = UI_CONFIG_CONSTANTS;

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
        branding: "Powered by Helpshift",
        attachmentRetryError: "Error: Click  to retry",
        attachmentFileSizeError: "Attachment exceeds limit of 25MB",
        attachmentDefaultError: "Error: Failed to upload attachment",
        businessHoursNameLabel: "Name",
        businessHoursEmailLabel: "Email",
        businessHoursMessageLabel: "Message",
        businessHoursNamePlaceholder: "Enter your name",
        businessHoursEmailPlaceholder: "john@example.com",
        businessHoursMessagePlaceholder: "Write your message",
        businessHoursSubmitBtn: "Send",
        businessHoursThankYouMessage: "Thanks for reaching out. We will get " +
                                      "back to you soon.",
        businessHoursViewHeader: "",
        businessHoursContactFormMessage: "",
        businessHoursOfflineMessage: "",
        dndInfoText: "Add files or drag here",
        businessHoursAttachmentsSizeExceedMsg: "Total size of attachments exceed 25 MB",
        businessHoursAttachmentsLimitExceedMsg: "Attachment exceeds maximum limit of 5"
      },
      uiConfig: DEFAULT_UI_CONFIG.reduce ((obj, config) => {
        // First elem in config is flattened ui config options (keys)
        const key = config [0];
        // Second elem in config is css variable name
        const cssVarName = config [1];
        // Third elem in config is the value
        const value = config [2];

        obj [key] = {
          key,
          value,
          cssVarName,
          setByConfig: false
        };

        return obj;
      }, {})
    };

    /**
     * Return update object for given ui config
     * @param {Object} uiConfig - ui config
     * @param {String} primaryColor - primary color
     * @returns {Object} - update ui object
     */
    const getUIConfigUpdateObj = (uiConfig, primaryColor) => {
      const allowedUpdateKeys = ["key", "value", "setByConfig"];
      const updateObj = {};

      for (const key in uiConfig) {
        if (uiConfig.hasOwnProperty (key)) {
          const config = uiConfig [key];
          updateObj [key] = {};
          // By pass unwanted keys set in ui config
          allowedUpdateKeys.forEach ((allowedKey) => {
            const configValue = config [allowedKey];
            updateObj [key][allowedKey] = {$set: configValue};

            if (configValue === PRIMARY_COLOR) {
              primaryColor = config.value;
            }
          });
        }
      }

      // Set light and dark shades of primary color
      updateObj [PRIMARY_COLOR_LIGHT] = {
        value: {$set: uiHelpers.shadeColor (primaryColor, uiHelpers.SHADE_LIGHT)},
        setByConfig: {$set:true}
      };
      updateObj [PRIMARY_COLOR_DARK] = {
        value: {$set: uiHelpers.shadeColor (primaryColor, uiHelpers.SHADE_DARK)},
        setByConfig: {$set: true}
      };

      return updateObj;
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
            uiConfig: {
              [PRIMARY_COLOR]: {
                value: {$set: config.appearance.primary_color},
                setByConfig: {$set: true}
              }
            }
          });

        case ACTION_TYPES.SET_GREETING_MESSAGE:
          return update (state, {
            text: {
              greetingMsg: {$set: action.message}
            }
          });

        case ACTION_TYPES.SET_UI_CONFIG:
          return update (state, {
            uiConfig: getUIConfigUpdateObj (
              action.uiConfig, state.uiConfig [PRIMARY_COLOR].value
            )
          });

        default:
          return state;
      }
    };
  }
);
