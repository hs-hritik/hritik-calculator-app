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
      FLATTENED_UI_CONFIG: {
        PRIMARY_COLOR,
        PRIMARY_COLOR_DARK,
        PRIMARY_COLOR_LIGHT,
        INITIAL_PRIMARY_BG_COLOR,
        INITIAL_PRIMARY_TEXT_COLOR,
        HEADER_BG_COLOR,
        HEADER_TEXT_COLOR
      },
      DERIVED_ID,
      SHADES
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

        // If the config is derived, then set setByConfig flag as true
        // as we want to update only those css variables which are set by config
        obj [key] = {
          key,
          value,
          cssVarName,
          setByConfig: key.indexOf (DERIVED_ID) !== -1
        };

        return obj;
      }, {})
    };

    /**
     * Return update object for given ui config
     * @param {Object} storeUIConfig - config object already set in ui store
     * @param {Object} uiConfig - config object passed by developers
     * @returns {Object} - update ui object used to set in store
     */
    const getUIConfigUpdateObj = (storeUIConfig, uiConfig) => {
      const allowedUpdateKeys = ["key", "value", "setByConfig"];
      let primaryColor = storeUIConfig [PRIMARY_COLOR].value;
      const updateObj = {};

      for (const key in uiConfig) {
        if (uiConfig.hasOwnProperty (key)) {
          const config = uiConfig [key];
          updateObj [key] = {};
          // Bypass unwanted keys set in ui config
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
        value: {$set: uiHelpers.shadeColor (primaryColor, SHADES.LIGHT_20)}
      };
      updateObj [PRIMARY_COLOR_DARK] = {
        value: {$set: uiHelpers.shadeColor (primaryColor, SHADES.DARK_20)}
      };

      // Derive colors for chat widget header
      // Precedence for setting header's background color
      // 1. developer config's 'initial' set
      // 2. developer config's 'primary' set
      // 3. ui state (default)
      const headerBgConfig = uiConfig [INITIAL_PRIMARY_BG_COLOR] ||
                             uiConfig [PRIMARY_COLOR] ||
                             storeUIConfig [INITIAL_PRIMARY_BG_COLOR];
      updateObj [HEADER_BG_COLOR] = {
        value: {$set: headerBgConfig.value}
      };

      // Precedence for setting header's text color
      // 1. developer config's 'initial' set
      // 2. ui state (default)
      // @NOTE :- There is no option to set primary text color in 'primary' set
      const headerTextConfig = uiConfig [INITIAL_PRIMARY_TEXT_COLOR] ||
                               storeUIConfig [INITIAL_PRIMARY_TEXT_COLOR];
      updateObj [HEADER_TEXT_COLOR] = {
        value: {$set: headerTextConfig.value}
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
            uiConfig: getUIConfigUpdateObj (state.uiConfig, action.uiConfig)
          });

        default:
          return state;
      }
    };
  }
);
