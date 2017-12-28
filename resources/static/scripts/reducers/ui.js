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
      FLATTENED_UI_CONFIG,
      FLATTENED_UI_CONFIG: {
        BASE_COLOR,
        BASE_COLOR_DARK,
        BASE_COLOR_LIGHT,
        INITIAL_PRIMARY_BG_COLOR,
        INITIAL_PRIMARY_TEXT_COLOR,
        HEADER_BG_COLOR,
        HEADER_TEXT_COLOR
      },
      ACCENT_COLOR_SETS,
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

        obj [key] = {
          key,
          value,
          cssVarName
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
      const allowedUpdateKeys = ["key", "value"];
      let baseColor = storeUIConfig [BASE_COLOR].value;
      const updateObj = {};

      for (const key in uiConfig) {
        if (uiConfig.hasOwnProperty (key)) {
          const config = uiConfig [key];
          updateObj [key] = {};
          // Bypass unwanted keys set in ui config
          allowedUpdateKeys.forEach ((allowedKey) => {
            const configValue = config [allowedKey];
            updateObj [key][allowedKey] = {$set: configValue};

            if (configValue === BASE_COLOR) {
              baseColor = config.value;
            }
          });
        }
      }

      // Set light and dark shades for
      // 1. Base light color
      // 2. Base dark color
      updateObj [BASE_COLOR_LIGHT] = {
        value: {$set: uiHelpers.shadeColor (baseColor, SHADES.LIGHT_20)}
      };
      updateObj [BASE_COLOR_DARK] = {
        value: {$set: uiHelpers.shadeColor (baseColor, SHADES.DARK_20)}
      };

      // Derive accent colors from accent color sets
      ACCENT_COLOR_SETS.forEach ((set) => {
        const accentColor = FLATTENED_UI_CONFIG [`${set}_ACCENT_COLOR`];
        const accentColorLight = FLATTENED_UI_CONFIG [`${set}_ACCENT_COLOR_LIGHT`];
        const accentColorConfig = uiConfig [accentColor] ||
                                  uiConfig [BASE_COLOR] ||
                                  storeUIConfig [BASE_COLOR];

        updateObj [accentColor] = {
          value: {$set: accentColorConfig.value}
        };

        updateObj [accentColorLight] = {
          value: {
            $set: uiHelpers.shadeColor (accentColorConfig.value, SHADES.LIGHT_10)
          }
        };
      });

      // Derive colors for chat widget header
      // Precedence for setting header's background color
      // 1. developer config's 'initial' set
      // 2. developer config's 'base' set
      // 3. ui state (default)
      const headerBgConfig = uiConfig [INITIAL_PRIMARY_BG_COLOR] ||
                             uiConfig [BASE_COLOR] ||
                             storeUIConfig [INITIAL_PRIMARY_BG_COLOR];
      updateObj [HEADER_BG_COLOR] = {
        value: {$set: headerBgConfig.value}
      };

      // Precedence for setting header's text color
      // 1. developer config's 'initial' set
      // 2. ui state (default)
      // @NOTE :- There is no option to set primary text color in 'base' set
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
              [BASE_COLOR]: {
                value: {$set: config.appearance.primary_color}
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
