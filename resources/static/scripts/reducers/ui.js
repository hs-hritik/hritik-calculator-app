/**
 * UI reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define("reducers/ui", [
  "constants/actionTypes",
  "constants/uiConfig",
  "constants/errors",
  "constants/localization",
  "helpers/ui",
  "gunpowder/utils/object",
  "utils/dataType"
], function(
  ACTION_TYPES,
  UI_CONFIG_CONSTANTS,
  errorConstants,
  localizationConstants,
  uiHelpers,
  objUtils,
  dataTypeUtils
) {
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
    TYPE: {NO_AUTH_TOKEN: NO_AUTH_ERROR, INVALID_USER_AUTH_TOKEN: INVALID_AUTH_ERROR}
  } = errorConstants;

  const INITIAL_STATE = {
    // @TODO: Remove after integrating it with backend
    // @TODO: Add ariaLabelOptionsList translations
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
      businessHoursThankYouMessage: "Thanks for reaching out. We will get back to you soon.",
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
      ariaLabelsRemoveAttachment: "Remove attachment",
      ariaLabelAddedAttachmentPrefix: "Attachment, {{file_name}}",
      ariaLabelAttachFiles: "Attach Files",
      ariaLabelFaqViewHeader: "Go back to conversation",
      ariaLabelLoading: "Loading...",
      ariaLabelSupportMsgAgentName:
        "Message from Support, {{message}}, Sent by {{agent_name}} at {{time_and_date}}",
      ariaLabelSupportMsgMissingAgentName:
        "Message from Support, {{message}}, Sent at {{time_and_date}}",
      ariaLabelUserMessage: "Your message, {{message}}, Sent at {{time_and_date}}",
      ariaLabelAttachmentUploading: "Your attachment, Uploading",
      ariaLabelOpenFile: "Open file, {{file_name}}",
      ariaLabelSendMessage: "Send message",
      ariaLabelJumpToLatestBtn: "Jump to latest message",
      ariaLabelTypingIndicator: "Support is typing",
      ariaLabelClearSearchInput: "Clear text",
      ariaLabelSearchList: "Search list",
      ariaLabelCloseSearch: "Close Search",
      ariaLabelOptionsList: "Options List",
      ariaLabelOpenChat: "Open Chat",
      ariaLabelCloseChat: "Close chat",
      ariaLabelLauncherBtnBadge: "{{num}} new messages from Support",
      intentsTitle: "Select a response",
      intentsReplyBoxPlaceholder: "Or enter your message",
      intentsReplyBoxPlaceholderEis: "Search for your problem",
      intentsSearchTitle: "You must be looking for",
      intentsEmptySearchTitle: "No suggestions",
      intentsEmptySearchDesc: "Send your message to start the conversation",
      intentsEmptySearchDescEis: "Sorry, we couldn't find what you are looking for",
      systemNickname: "Support"
    },
    uiConfig: DEFAULT_UI_CONFIG.reduce((obj, config) => {
      // First elem in config is flattened ui config options (keys)
      const key = config[0];
      // Second elem in config is css variable name
      const cssVarName = config[1];
      // Third elem in config is the value
      const value = config[2];

      obj[key] = {
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
   * @param {Object} config - XHR returned response
   * @param {Object} config.translations - map of strings received from XHR
   * @returns {Object} - update object to set values in the store
   */
  const getUiTextUpdateObj = (config) => {
    const xhrTextStrings = config.translations;
    const {UI_STRING_KEYS} = localizationConstants;
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
    const personalisedConversationIsEnabled = config.personalised_conversation_enabled;

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

    if (personalisedConversationIsEnabled) {
      textUpdateObj.systemNickname = {
        $set: config.avatar.system_nickname
      };
    }

    objUtils.forEachKey(xhrTextStrings, (xhrKey, uiString) => {
      const stateKey = UI_STRING_KEYS[xhrKey];
      textUpdateObj[stateKey] = {$set: uiString};
    });

    return textUpdateObj;
  };

  /**
   * Return update object for given ui config
   * @param {Object} state - UI Store object
   * @param {Object} helpshiftConfig - The global client config object
   * @returns {Object} - update ui object used to set in store
   */
  const _getSetUiConfigUpdateObj = (state, helpshiftConfig) => {
    const uiConfig = _getUiConfig(state, helpshiftConfig);
    const validUiConfig = uiHelpers.getValidUiConfig(uiConfig);
    const storeUiConfig = state.uiConfig;
    const allowedUpdateKeys = ["key", "value"];
    let baseColor = storeUiConfig[BASE_COLOR].value;
    const updateObj = {};

    for (const key in validUiConfig) {
      if (validUiConfig.hasOwnProperty(key)) {
        const config = validUiConfig[key];
        updateObj[key] = {};
        // Bypass unwanted keys set in ui config
        allowedUpdateKeys.forEach((allowedKey) => {
          const configValue = config[allowedKey];
          updateObj[key][allowedKey] = {$set: configValue};

          if (configValue === BASE_COLOR) {
            baseColor = config.value;
          }
        });
      }
    }

    // Set light and dark shades for
    // 1. Base light color
    // 2. Base dark color
    updateObj[BASE_COLOR_LIGHT] = {
      value: {$set: uiHelpers.shadeColor(baseColor, SHADES.LIGHT_20)}
    };
    updateObj[BASE_COLOR_DARK] = {
      value: {$set: uiHelpers.shadeColor(baseColor, SHADES.DARK_20)}
    };

    // Derive accent colors from accent color sets
    ACCENT_COLOR_SETS.forEach((set) => {
      const accentColor = FLATTENED_UI_CONFIG[`${set}_ACCENT_COLOR`];
      const accentColorLight = FLATTENED_UI_CONFIG[`${set}_ACCENT_COLOR_LIGHT`];
      const accentColorConfig =
        validUiConfig[accentColor] || validUiConfig[BASE_COLOR] || storeUiConfig[BASE_COLOR];

      updateObj[accentColor] = {
        value: {$set: accentColorConfig.value}
      };

      updateObj[accentColorLight] = {
        value: {
          $set: uiHelpers.shadeColor(accentColorConfig.value, SHADES.LIGHT_40)
        }
      };
    });

    // Derive colors for chat widget header
    // Precedence for setting header's background color
    // 1. developer config's 'initial' set
    // 2. developer config's 'base' set
    // 3. ui state (default)
    const headerBgConfig =
      validUiConfig[INITIAL_PRIMARY_BG_COLOR] ||
      validUiConfig[BASE_COLOR] ||
      storeUiConfig[INITIAL_PRIMARY_BG_COLOR];
    updateObj[HEADER_BG_COLOR] = {
      value: {$set: headerBgConfig.value}
    };

    // Precedence for setting header's text color
    // 1. developer config's 'initial' set
    // 2. ui state (default)
    // @NOTE :- There is no option to set primary text color in 'base' set
    const headerTextConfig =
      validUiConfig[INITIAL_PRIMARY_TEXT_COLOR] || storeUiConfig[INITIAL_PRIMARY_TEXT_COLOR];
    updateObj[HEADER_TEXT_COLOR] = {
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
      if (uiConfig.hasOwnProperty(set)) {
        const config = uiConfig[set];
        updateObj[set] = {};

        allowedUpdateKeys.forEach((allowedKey) => {
          const configValue = config[allowedKey];
          if (configValue) {
            updateObj[set][allowedKey] = {$set: configValue};

            // If base colors are to be derived
            if (configValue === BASE_COLOR) {
              const baseColor = config.value;

              updateObj[BASE_COLOR_LIGHT] = {
                value: {$set: uiHelpers.shadeColor(baseColor, SHADES.LIGHT_20)}
              };
              updateObj[BASE_COLOR_DARK] = {
                value: {$set: uiHelpers.shadeColor(baseColor, SHADES.DARK_20)}
              };
            }
          }
        });
      }
    }

    // B] If accent color belongs to valid set and is passed in config
    // derive accent colors
    ACCENT_COLOR_SETS.forEach((accentSet) => {
      const accentColor = FLATTENED_UI_CONFIG[`${accentSet}_ACCENT_COLOR`];

      if (uiConfig[accentColor] || uiConfig[BASE_COLOR]) {
        const accentColorLight = FLATTENED_UI_CONFIG[`${accentSet}_ACCENT_COLOR_LIGHT`];
        const accentColorConfig =
          uiConfig[accentColor] || uiConfig[BASE_COLOR] || storeUiConfig[BASE_COLOR];

        updateObj[accentColor] = {
          value: {$set: accentColorConfig.value}
        };

        updateObj[accentColorLight] = {
          value: {
            $set: uiHelpers.shadeColor(accentColorConfig.value, SHADES.LIGHT_40)
          }
        };
      }
    });

    // C] Update header styles if passed in ui config
    const headerBgConfig = uiConfig[INITIAL_PRIMARY_BG_COLOR] || uiConfig[BASE_COLOR];
    if (headerBgConfig) {
      updateObj[HEADER_BG_COLOR] = {
        value: {$set: headerBgConfig.value}
      };
    }

    const headerTextConfig = uiConfig[INITIAL_PRIMARY_TEXT_COLOR];
    if (headerTextConfig) {
      updateObj[HEADER_TEXT_COLOR] = {
        value: {$set: headerTextConfig.value}
      };
    }

    return updateObj;
  };

  /**
   * Returns the UI config
   * @param {Object} state - UI Store object
   * @param {Object} helpshiftConfig - The global client config object
   * @returns {Object} - UI config object
   */
  const _getUiConfig = (state, helpshiftConfig) => {
    const {uiConfig, developerUiConfig} = state;

    let finalUiConfig;

    // If ui config is passed in helpshift config options, use that
    // Else use previously set developer config
    // Else create a ui config having base color set from dashboard
    if (
      dataTypeUtils.isObject(helpshiftConfig.uiConfig) &&
      Object.keys(helpshiftConfig.uiConfig).length
    ) {
      finalUiConfig = helpshiftConfig.uiConfig;
    } else if (developerUiConfig) {
      finalUiConfig = developerUiConfig;
    } else {
      const baseData = BASE_COLOR.split(".");
      // name of base set
      const baseSet = baseData[0];
      // value of base set
      const baseValue = baseData[1];

      finalUiConfig = {
        [baseSet]: {
          [baseValue]: uiConfig[BASE_COLOR].value
        }
      };
    }

    return finalUiConfig;
  };

  return (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case ACTION_TYPES.FETCH_CONFIG_SUCCESS:
        const {config} = action;
        const updatedConfig = update(state, {
          uiConfig: {
            [BASE_COLOR]: {
              value: {$set: config.appearance.primary_color}
            }
          }
        });

        /**
         * Set UI configuration in the state using the configuration set in the admin
         * dashboard and by the custom configuration passed with helpshiftConfig.
         */
        const uiConfig = _getSetUiConfigUpdateObj(updatedConfig, action.helpshiftConfig);
        const developerUiConfig = _getUiConfig(state, action.helpshiftConfig);

        return update(state, {
          text: getUiTextUpdateObj(config),
          uiConfig: uiConfig,
          developerUiConfig: {$set: developerUiConfig}
        });

      case ACTION_TYPES.SET_GREETING_MESSAGE:
        return update(state, {
          text: {
            greetingMsg: {$set: action.message}
          }
        });

      case ACTION_TYPES.UPDATE_UI_CONFIG:
        return update(state, {
          uiConfig: getUpdateUiConfigUpdateObj(state.uiConfig, action.uiConfig)
        });

      case ACTION_TYPES.SET_DEVELOPER_UI_CONFIG:
        return update(state, {
          developerUiConfig: {$set: action.uiConfig}
        });

      default:
        return state;
    }
  };
});
