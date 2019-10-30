/**
 * UI reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/ui",
  [
    "constants/actionTypes",
    "constants/uiConfig",
    "constants/errors",
    "constants/localization",
    "helpers/ui",
    "gunpowder/utils/object"
  ],
  function (ACTION_TYPES, UI_CONFIG_CONSTANTS, errorConstants, localizationConstants,
    uiHelpers, objUtils) {
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

    const {
      TYPE: {
        NO_AUTH_TOKEN: NO_AUTH_ERROR,
        INVALID_USER_AUTH_TOKEN: INVALID_AUTH_ERROR
      }
    } = errorConstants;

    const INITIAL_STATE = {
      // @TODO: Remove after integrating it with backend
      text: {
        chatViewHeader: "Chat with us",
        chatViewConversationResolutionQuestion: "Did we answer all your questions?",
        chatViewStartNewConversation: "Start a new conversation",
        chatViewIssueRejectionQuestion: "What else can we help you with?",
        greetingMsg: "Hi, how can we help you?",
        resolutionQuestionAccept: "Yes",
        resolutionQuestionReject: "No",
        conversationClosed: "Conversation closed.",
        faqViewHeader: "Back",
        closeConversationBtn: "Close",
        replyBtnPlaceholder: "Write your message",
        csatBotRequestMsg: "Do you have a moment to rate your experience?",
        csatBotResponseMsg: "Thanks for your feedback!",
        csatBotFormSubmitBtn: "Submit",
        csatBotReviewPlaceholder: "Leave us additional feedback",
        csatBotReviewTitle: "Additional Feedback",
        csatViewHeader: "Chat with us",
        branding: "Powered by Helpshift",
        attachmentUploadingStatus: "Uploading..",
        attachmentRetryError: "Error. Click  to retry.",
        attachmentFileSizeError: "Attachment exceeds limit of 25MB",
        attachmentFileTypeError: "Error, file type not supported",
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
        businessHoursAttachmentsLimitExceedMsg: "Attachment exceeds maximum limit of 5",
        emailValidationError: "Enter a valid email address",
        numberValidationError: "Enter a valid number",
        dateValidationError: "Enter a valid date in DD/MM/YYYY format",
        retryBtn: "RETRY",
        noInternetConnection: "No internet connection",
        userRedactionMessage: "Something went wrong. Please refresh",
        unknownErrorReconnecting: "Something went wrong. Reconnecting...",
        networkError: "Network Error",
        connectingText: "Connecting...",
        conversationRedactedMsg: "Conversation Redacted",
        conversationsRedactedMsg: "Conversations Redacted",
        pastConversationsLoadingText: "Loading Messages...",
        messageDeleted: "Message Deleted",
        loadMoreMessagesFailedText: "Couldn't Load Messages.",
        clickToRetryText: "Click to Retry",
        // We do not want to support i18n for unsupported date input.
        // So the placeholder text will always be in english.
        unsupportedDateInputPlaceholder: "DD/MM/YYYY",
        errorMessage: {
          [NO_AUTH_ERROR]: {
            title: "Authentication Failed",
            subtitle: "Unable to reach support"
            // @TODO: Confirm if a CTA is needed.
          },
          [INVALID_AUTH_ERROR]: {
            title: "Authentication Failed",
            subtitle: "Unable to reach support"
            // @TODO: Confirm if a CTA is needed.
          }
        },
        searchPlaceholder: "Search",
        noSearchResultsText: "No results found",
        ariaLabels: {
          removeAttachment: "Remove attached file icon",
          addedAttachmentPrefix: "Attachment",
          attachFiles: "Attach Files",
          faqViewHeader: "Go back to conversation",
          loading: "Loading",
          supportMsg: "Message from Support",
          sentBy: "Sent by",
          sentAt: "Sent at",
          userMessage: "Your message",
          openFile: "Open file",
          attachmentUploading: "Your attachment, Uploading",
          sendMessage: "Send Message",
          send: "Send",
          jumpToLatestBtn: "Jump to latest message",
          typingIndicator: "Support is typing",
          conversationClosedLine: "Conversation closed"
        }
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
      }, {}),
      developerUiConfig: null
    };

    /**
     * Return update object to update text strings in state
     * @param {Object} xhrTextStrings - map of strings recieved from XHR
     * @returns {Object} - update object to set values in the store
     */
    const getUiTextUpdateObj = (xhrTextStrings) => {
      const updateObj = {};
      const {UI_STRING_KEYS} = localizationConstants;

      objUtils.forEachKey (xhrTextStrings, (xhrKey, uiString) => {
        const stateKey = UI_STRING_KEYS [xhrKey];
        updateObj [stateKey] = {$set: uiString};
      });

      return updateObj;
    };

    /**
     * Return update object for given ui config
     * @param {Object} storeUiConfig - config object already set in ui store
     * @param {Object} uiConfig - config object passed by developers
     * @returns {Object} - update ui object used to set in store
     */
    const getSetUiConfigUpdateObj = (storeUiConfig, uiConfig) => {
      const allowedUpdateKeys = ["key", "value"];
      let baseColor = storeUiConfig [BASE_COLOR].value;
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
                                  storeUiConfig [BASE_COLOR];

        updateObj [accentColor] = {
          value: {$set: accentColorConfig.value}
        };

        updateObj [accentColorLight] = {
          value: {
            $set: uiHelpers.shadeColor (accentColorConfig.value, SHADES.LIGHT_40)
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
                             storeUiConfig [INITIAL_PRIMARY_BG_COLOR];
      updateObj [HEADER_BG_COLOR] = {
        value: {$set: headerBgConfig.value}
      };

      // Precedence for setting header's text color
      // 1. developer config's 'initial' set
      // 2. ui state (default)
      // @NOTE :- There is no option to set primary text color in 'base' set
      const headerTextConfig = uiConfig [INITIAL_PRIMARY_TEXT_COLOR] ||
                               storeUiConfig [INITIAL_PRIMARY_TEXT_COLOR];
      updateObj [HEADER_TEXT_COLOR] = {
        value: {$set: headerTextConfig.value}
      };

      return updateObj;
    };

    /**
     * Return update object for update ui config api
     * @param {Object} storeUiConfig - config object already set in ui store
     * @param {Object} uiConfig - config object passed by developers
     * @returns {Object} - update ui object used to set in store
     */
    const getUpdateUiConfigUpdateObj = (storeUiConfig, uiConfig) => {
      const allowedUpdateKeys = ["key", "value"];
      const updateObj = {};

      // A] Copy only allowed keys for a predefined set in updateObj
      for (const set in uiConfig) {
        if (uiConfig.hasOwnProperty (set)) {
          const config = uiConfig [set];
          updateObj [set] = {};

          allowedUpdateKeys.forEach ((allowedKey) => {
            const configValue = config [allowedKey];
            if (configValue) {
              updateObj [set][allowedKey] = {$set: configValue};

              // If base colors are to be derived
              if (configValue === BASE_COLOR) {
                const baseColor = config.value;

                updateObj [BASE_COLOR_LIGHT] = {
                  value: {$set: uiHelpers.shadeColor (baseColor, SHADES.LIGHT_20)}
                };
                updateObj [BASE_COLOR_DARK] = {
                  value: {$set: uiHelpers.shadeColor (baseColor, SHADES.DARK_20)}
                };
              }
            }
          });
        }
      }

      // B] If accent color belongs to valid set and is passed in config
      // derive accent colors
      ACCENT_COLOR_SETS.forEach ((accentSet) => {
        const accentColor = FLATTENED_UI_CONFIG [`${accentSet}_ACCENT_COLOR`];

        if (uiConfig [accentColor] || uiConfig [BASE_COLOR]) {
          const accentColorLight = FLATTENED_UI_CONFIG [`${accentSet}_ACCENT_COLOR_LIGHT`];
          const accentColorConfig = uiConfig [accentColor] ||
                                    uiConfig [BASE_COLOR] ||
                                    storeUiConfig [BASE_COLOR];

          updateObj [accentColor] = {
            value: {$set: accentColorConfig.value}
          };

          updateObj [accentColorLight] = {
            value: {
              $set: uiHelpers.shadeColor (accentColorConfig.value, SHADES.LIGHT_40)
            }
          };
        }
      });

      // C] Update header styles if passed in ui config
      const headerBgConfig = uiConfig [INITIAL_PRIMARY_BG_COLOR] ||
                             uiConfig [BASE_COLOR];
      if (headerBgConfig) {
        updateObj [HEADER_BG_COLOR] = {
          value: {$set: headerBgConfig.value}
        };
      }

      const headerTextConfig = uiConfig [INITIAL_PRIMARY_TEXT_COLOR];
      if (headerTextConfig) {
        updateObj [HEADER_TEXT_COLOR] = {
          value: {$set: headerTextConfig.value}
        };
      }

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
            csatBotRequestMsg: {$set: config.csat_bot.req_msg},
            chatViewConversationResolutionQuestion: {
              // @TODO - Confirm the key after BE integration
              $set: config.resolution_question
            }
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
            uiConfig: getSetUiConfigUpdateObj (state.uiConfig, action.uiConfig)
          });

        case ACTION_TYPES.SET_UI_TEXT:
          return update (state, {
            text: getUiTextUpdateObj (action.text)
          });

        case ACTION_TYPES.UPDATE_UI_CONFIG:
          return update (state, {
            uiConfig: getUpdateUiConfigUpdateObj (state.uiConfig, action.uiConfig)
          });

        case ACTION_TYPES.SET_DEVELOPER_UI_CONFIG:
          return update (state, {
            developerUiConfig: {$set: action.uiConfig}
          });

        default:
          return state;
      }
    };
  }
);
