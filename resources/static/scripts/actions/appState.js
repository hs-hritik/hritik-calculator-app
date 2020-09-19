/**
 * App state related actions.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 7, 2017
 */

define("actions/appState", [
  "constants/actionTypes",
  "constants/routes",
  "constants/appState",
  "constants/uiConfig",
  "constants/analytics",
  "constants/activeView",
  "constants/errors",
  "helpers/xhr",
  "helpers/localStorage",
  "helpers/audio",
  "helpers/proactiveChat",
  "helpers/ui",
  "helpers/analytics",
  "helpers/common",
  "gunpowder/utils/xhr",
  "gunpowder/utils/uuid",
  "store",
  "actions/chatView",
  "actions/ui",
  "actions/batch",
  "actions/actionCreators",
  "actions/postSdkMessage",
  "actions/common",
  "utils/browser",
  "utils/color"
], function(
  ACTION_TYPES,
  routes,
  APP_STATE_CONSTANTS,
  UI_CONFIG_CONSTANTS,
  analyticsConstants,
  ACTIVE_VIEW,
  ERROR_CONSTANTS,
  xhrHelpers,
  lsHelpers,
  audioHelpers,
  proactiveChatHelpers,
  uiHelpers,
  analyticsHelpers,
  commonHelpers,
  xhr,
  getUuid,
  store,
  chatViewActions,
  uiActions,
  batchActions,
  actionCreators,
  postSdkMessage,
  commonActions,
  browserUtils,
  colorUtils
) {
  "use strict";

  const {
    ANON_USER_RESET_TIMEOUT,
    TRIGGER,
    ISSUE_STATE_RESET,
    APP_RESET_TRIGGER
  } = APP_STATE_CONSTANTS;

  const {
    FLATTENED_UI_CONFIG: {
      HEADER_BG_COLOR,
      HEADER_TEXT_COLOR,
      INITIAL_SECONDARY_BG_COLOR,
      INITIAL_SECONDARY_TEXT_COLOR,
      BASE_FOCUS_RING_COLOR,
      CHAT_WIDGET_BG_COLOR,
      FORM_BG_COLOR
    },
    SHADES
  } = UI_CONFIG_CONSTANTS;
  const {EVENT} = analyticsConstants;

  const {TYPE: ERROR_TYPES, RESPONSE_STATUS_CODE} = ERROR_CONSTANTS;
  const LATEST_ISSUE_NOT_AVAILABLE = "NOT_AVAILABLE";

  const isCssVarSupported =
    window.CSS && window.CSS.supports && window.CSS.supports("--fake-var", 0);

  const {LS_KEYS} = lsHelpers;

  let getConfigXhr = null;

  /**
   * Set the Device id value in the state/localstorage via an action.
   * If a value is present in the localstorage, keep using the same
   * value.
   */
  const setDeviceId = () => {
    return () => {
      let dId = lsHelpers.get(LS_KEYS.DEVICE_ID);

      // Create a new device id if one doesn't exist already.
      // Set it in the local storage.
      if (!dId) {
        dId = getUuid();
      }

      // Set the device id in the state.
      store.dispatch(setDeviceIdValue(dId));
    };
  };

  /**
   * Set the analytics session id value in the state/localstorage via an action.
   * If a value is present in the localstorage, keep using the same value.
   * This value is used with the payload of all the anaytics events fired by
   * web chat.
   */
  const setAnalyticsSessionId = () => {
    return (dispatch) => {
      let sessionId = lsHelpers.get(LS_KEYS.ANALYTICS_SESSION_ID);

      // Create a new session id if one doesn't exist already.
      // Set it in the local storage.
      if (!sessionId) {
        sessionId = getUuid();
      }

      dispatch(setAnalyticsSessionIdValue(sessionId));
    };
  };

  /**
   * Update the analytics session id value with a new uuid.
   */
  const updateAnalyticsSessionId = () => {
    return (dispatch) => {
      dispatch(setAnalyticsSessionIdValue(getUuid()));
    };
  };

  /**
     * Set user identifier for anon user in state and localstorage.
     * Checks localstorage if an anon user id already exists.
     * If it does, it gets the value from the ls and sets it in the
     * state while not affecting ls at all.
     * If it does not exist, it sets a new value (`anonUserId`) in state
     * and localstorage.
     *
     * FAQ: How does Web Chat identify the user?
     * https://helpshift.atlassian.net/wiki/spaces/FRON/pages/774963891/
       FAQ#FAQ-4.HowdoestheWebChatidentifytheuser?
     */
  const setAnonUserId = () => {
    return () => {
      const currentAnonUserId = lsHelpers.get(LS_KEYS.ANON_USER_ID);

      if (!currentAnonUserId) {
        const anonUserId = commonHelpers.getAnonUserId();

        store.dispatch(setAnonUserIdValue(anonUserId));
        lsHelpers.set(LS_KEYS.ANON_USER_ID, anonUserId);
      } else {
        store.dispatch(setAnonUserIdValue(currentAnonUserId));
      }
    };
  };

  /**
   * Action for when a conversation starts
   * @param {boolean} conversationHistoryIsEnabled
   * @returns {Object} - Action
   */
  const conversationStarted = (conversationHistoryIsEnabled) => {
    return {
      type: ACTION_TYPES.NEW_CONVERSATION_STARTED,
      conversationHistoryIsEnabled
    };
  };

  /**
   * Rehydrate the state with localstorage data, if applicable.
   * Although we get the state data from backend for continuing the conversation,
   * there are some values that are web chat client specific and need to be
   * added back to the state. For example - which FAQs have been read by the
   * user so far.
   * @param {String} uniqueUserIdentifier - Unique identifier of a user
   */
  const rehydrateState = (uniqueUserIdentifier) => {
    // @TODO: feature/ai-powered : Handle rehydration
    const suggestedFaqReadTracked = lsHelpers.get(LS_KEYS.SUGGESTED_FAQ_READ_TRACKED),
      readFaqList = lsHelpers.get(LS_KEYS.READ_FAQ_LIST, true),
      reEngagementId = lsHelpers.get(LS_KEYS.RE_ENGAGEMENT_ID),
      widgetShouldAutoOpen = lsHelpers.get(LS_KEYS.WIDGET_SHOULD_AUTO_OPEN),
      pfiValue = lsHelpers.get(LS_KEYS.PFI_VALUE) ? lsHelpers.get(LS_KEYS.PFI_VALUE) : 0,
      config = lsHelpers.get(LS_KEYS.CONFIG, true),
      respectPfi = lsHelpers.get(LS_KEYS.RESPECT_PFI, true);
    let lastConfigFetchTs = null;
    let issueExistsDataIsStaleInLocalStorage = null;

    if (config && config[uniqueUserIdentifier]) {
      lastConfigFetchTs = config[uniqueUserIdentifier].lastConfigFetchTs;
      issueExistsDataIsStaleInLocalStorage =
        config[uniqueUserIdentifier].issueExistsDataIsStaleInLocalStorage;
    }

    store.dispatch({
      type: ACTION_TYPES.REHYDRATE,
      data: {
        suggestedFaqReadTracked,
        readFaqList,
        reEngagementId,
        widgetShouldAutoOpen,
        pfiValue,
        lastConfigFetchTs,
        respectPfi,
        issueExistsDataIsStaleInLocalStorage
      }
    });
  };

  /**
   * Return tags array containing string values converted to lowercase
   * @param {Any} - Unprocessed tags
   * @returns {(Array|null)} - Processed tags containing only string values
   *                           converted to lowercase
   */
  const getProcessedTags = function(tags) {
    let validTags = null;

    // Tags must be a non empty array
    if (Array.isArray(tags) && tags.length) {
      validTags = tags.filter((tag) => {
        // Filter string values
        return typeof tag === "string";
      });
    }

    return validTags;
  };

  /**
   * Action to set device id.
   * @param {String} id - device id
   * @returns {Object}
   */
  const setDeviceIdValue = (id) => ({
    type: ACTION_TYPES.SET_DEVICE_ID,
    id
  });

  /**
   * Action to analytics session id.
   * @param {string} id - session id
   * @returns {Object}
   */
  const setAnalyticsSessionIdValue = (id) => ({
    type: ACTION_TYPES.SET_ANALYTICS_SESSION_ID,
    id
  });

  /**
   * Action to set anon user id.
   * @param {string} id - anon user id
   * @returns {Object}
   */
  const setAnonUserIdValue = (id) => ({
    type: ACTION_TYPES.SET_ANON_USER_ID,
    id
  });

  /**
   * Action to set client's configuration like platform id, domain, etc.
   * @param {Object} config
   * @returns {Object} - action
   */
  const setClientConfig = (config) => {
    const {tags, userId, userEmail, clearAnonymousUserOnLogin, userName, language} = config;

    const {isUserIdValid, isEmailValid} = commonHelpers;

    // Filter string values and convert to lower case
    config.tags = getProcessedTags(tags);

    // If userId is passed, validate it.
    // If userEmail is passed, validate it.
    // If either of the two is passed and is invalid, drop both the values.
    if ((userId && !isUserIdValid(userId)) || (userEmail && !isEmailValid(userEmail))) {
      delete config.userId;
      delete config.userEmail;
      // @TODO: Check with product if we need to throw an error for the client
      // developer to know about this.
    }

    // User's names are to be truncated if they are more than 255 chars.
    if (userName) {
      config.userName = userName.slice(0, 255);
    }

    // If developerSetLanguage (config.language) is not set, default it to `en-US`.
    // If it's set to `browserDefault`, don't set developerSetLanguage so that
    // browser language is used for localization.
    // This behavior is so that we don't start localizing strings for apps that
    // don't want it by default. This would be removed once developers are given
    // enough time to start using the developer set language option.
    if (!language) {
      config.language = "en-US";
    } else if (language === "browserDefault") {
      delete config.language;
    }

    // The following action (SET_CLIENT_CONFIG) sets the userId passed by the
    // developer in the state and localstorage. Before setting it in localstorage
    // we need to determine if we should handle the user login change.
    handleAnonUserReset({userId, clearAnonymousUserOnLogin, isLiteSdk: !!config.liteSdkConfig});

    return {
      type: ACTION_TYPES.SET_CLIENT_CONFIG,
      config
    };
  };

  /**
   * Clean anon user id if applicable.
   * The user id passed with `helpshiftConfig` compared with the previous
   * user id determines whether the end user logged in or logged out.
   * Based on the client's config value of clearAnonymousUserOnLogin, reset the
   * anon user id.
   * Also, clear the anonymous user id after 7 days of inactivity.
   * @param {Object} data
   * @param {string} data.userId - The userId value passed with `helpshiftConfig`.
   * @param {boolean} data.clearAnonymousUserOnLogin - If true, remove anonymous user
   * id from local storage
   * @param {boolean} data.isLiteSdk - If true, do not remove anonymous user id after
   * 7 days of inactivity from local storage
   */
  const handleAnonUserReset = ({userId, clearAnonymousUserOnLogin, isLiteSdk}) => {
    // Clear anon user id after 7 days of inactivity
    const lastActivityTime = lsHelpers.get(LS_KEYS.LAST_ACTIVITY_TIME, true);
    const inactivityDuration = Date.now() - lastActivityTime;

    if (!isLiteSdk && lastActivityTime && inactivityDuration > ANON_USER_RESET_TIMEOUT) {
      lsHelpers.remove(LS_KEYS.ANON_USER_ID);
    }

    // Clear anon user if a user logs in and clearAnonymousUserOnLogin flag is true
    if (!commonHelpers.isUserIdValid(userId) || !clearAnonymousUserOnLogin) {
      return;
    }

    if (userId) {
      // Cases in which anonymous user has to be remove
      // - anon user -> a user logged in
      // - A user was logged in -> they logged out -> a new user logged in.
      // - A user was logged in -> they logged out -> then the same user logged in.
      lsHelpers.remove(LS_KEYS.ANON_USER_ID);
    }
  };

  /**
   * Apply styles to hs-page
   */
  const applyPageStyles = () => {
    const {appState} = store.getState();
    const page = document.querySelector(".hs-page");

    if (appState.browserIsMobile) {
      page.classList.add("hs-page--mobile");
    }

    if (appState.sdkConfigOptions.fullScreen) {
      page.classList.add("hs-page--full-screen");
    }
  };

  /**
   * Initialize conversation - either enable the chat view or the out of
   * business hours view.
   */
  const initializeConversation = () => {
    const {dispatch, getState} = store;
    // If business hours is enabled and it's out of business hours currently,
    // show out of business hours view
    if (commonHelpers.isOutOfBusinessHours()) {
      dispatch(actionCreators.updateActiveView(ACTIVE_VIEW.BUSINESS_HOURS));
    } else {
      // The active view is set to chat view by default. If we are not handling
      // the out of business hours case, we need to start the conversation on the
      // chat view.
      const {
        appState: {issueExists, appResetTrigger, minimized, liteSdkConfig},
        ui: {
          uiConfig: {
            [FORM_BG_COLOR]: {value: formBgColor}
          }
        }
      } = getState();
      const widgetIsOpen = !minimized;

      if (!issueExists) {
        if (liteSdkConfig.os) {
          dispatch(
            postSdkMessage.sendSafeAreaColorToLiteSdk({
              safeAreaColor: colorUtils.convertThreeToSixCharHexColorCode(formBgColor)
            })
          );
        }

        dispatch(
          postSdkMessage.conversationStatusEvent({
            open: false,
            latestIssueId: LATEST_ISSUE_NOT_AVAILABLE,
            latestIssuePublishId: LATEST_ISSUE_NOT_AVAILABLE
          })
        );

        // Pre-load the intents tree.
        dispatch(loadIntents());
      }

      // If at least one issue exists on backend then start the poller.
      // (poller will check for issue state)
      // Else start a new conversation by creating new preIssue.

      // App reset trigger is used to determine way by which app has been reset.
      // We have to handle app reset scenarios differently.
      // If app reset is triggered by
      // 1. preIssue reset conditions and widget is open
      //    OR
      // 2. new conversation via initial user message set via the setInitialUserMessage API
      //    OR
      // 3. update helpshift config api and widget is open and issue does not
      //    exist i.e. new user
      // Then explicitly create a new preIssue.
      // OR
      // If issue exists for a user, then start the poller.
      // Note - For the other app reset trigger i.e. INITIAL, don't do anything.
      // INITIAL means that the app hasn't reset via any of the other triggers.
      // `handleMessengerToggle` in `api.js`.
      if (
        (appResetTrigger === APP_RESET_TRIGGER.PRE_ISSUE_RESET && widgetIsOpen) ||
        appResetTrigger === APP_RESET_TRIGGER.NEW_CONV_VIA_INITIAL_USER_MESSAGE_API ||
        (appResetTrigger === APP_RESET_TRIGGER.UPDATE_HELPSHIFT_CONFIG_API &&
          widgetIsOpen &&
          !issueExists)
      ) {
        dispatch(
          startNewConversation({
            resetSessionId: true
          })
        );
      } else if (issueExists) {
        // The issueExists flag is true if for the given profile (user+device combination), at
        // least one issue, irrespective of its state, exists. In that case, we start the poller
        // to receive the latest updates from the backend and update our state accordingly.
        // If the latest issue is resolved, we show the new conversation button, which starts a
        // new conversation.
        // If it's open, we keep polling.
        chatViewActions.startPollingForMessages();
      }

      // The reset trigger is reset to its default value once appropriate
      // action is performed.
      dispatch(actionCreators.setAppResetTrigger(APP_RESET_TRIGGER.INITIAL));
    }
  };
  /**
   * Whether the config call can be made
   * @param {Object} data
   * @param {string} data.pfiValue - Periodic fetch interval value
   * @param {string} data.lastConfigFetchTs - Last config fetched timestamp in milli seconds
   * @param {number} data.currentTime - Current time in milli seconds
   * @param {boolean} data.respectPfi - True, if debug mode is enabled
   * @param {Object} data.configFromLs - Config from local storage
   * @returns {boolean} - True, if the config xhr should be called
   */
  const _shouldFetchConfig = ({
    pfiValue,
    lastConfigFetchTs,
    currentTime,
    respectPfi,
    configFromLs,
    issueExistsDataIsStaleInLocalStorage
  }) => {
    // The PFI session gets expired in the following case
    // 1. Debug mode is enabled through Helpshift API which means not respecting the PFI value
    // 1. Periodic fetch interval value is not set
    // 2. Current time is greater than adding pfi value to last fetched ts
    const pfiSessionIsExpired =
      !respectPfi ||
      !pfiValue ||
      (pfiValue && parseInt(lastConfigFetchTs, 10) + parseInt(pfiValue, 10) <= currentTime);

    return (
      !(issueExistsDataIsStaleInLocalStorage === false) ||
      pfiSessionIsExpired ||
      (!pfiSessionIsExpired && !configFromLs)
    );
  };

  /**
   * Get web chat config via the HS API
   * @param {Object} data
   * @param {Object} data.callbacks - callbacks passed by the caller e.g. onSuccess
   */
  const _getConfigFromBackend = ({callbacks}) => {
    return (dispatch, getState) => {
      const {
        appState: {domain}
      } = getState();

      // IE 11 caches config call which causes new preIssues to be created for
      // new user. In order to invalidate browser cache we are sending a new
      // timestamp in every request.
      const requestData = xhrHelpers.getPreparedXhrData();
      requestData.nonce = Date.now();

      getConfigXhr = xhr({
        route: routes.getWmConfig(domain),
        headers: xhrHelpers.getCommonHeaders(),
        data: requestData,
        onSuccess: callbacks.onSuccess,
        onFailure: callbacks.onFailure
      });
    };
  };

  /**
   * Return config object from local storage
   * @param {String} uniqueUserIdentifier - Unique identifier of a user
   * @returns {Object} - Returns config object
   */
  const _getConfigFromLs = (uniqueUserIdentifier) => {
    const config = lsHelpers.get(LS_KEYS.CONFIG, true);

    if (!config || !config[uniqueUserIdentifier]) {
      return null;
    }

    return config[uniqueUserIdentifier].config;
  };

  /**
   * Callback function for config success
   * @param {object} data
   * @param {object} data.response - Config xhr success response
   * @param {string} data.trigger - The source that triggered setting the config
   * @param {Object} data.helpshiftConfig - The global client config object
   * @param {string} data.currentTime - Current time in milliseconds
   * @param {boolean} data.updateLs - True, if config fetched from backend XHR directly
   */
  const _onConfigSuccess = ({response, trigger, helpshiftConfig, currentTime, updateLs}) => {
    const {dispatch, getState} = store;
    const {userId, phoneNumber, userEmail, anonUserIdentifier} = getState().appState;
    // Unique user identifier is needed to store the config respective to every person
    // who login. The user can log in with the userId, email, phone number, and the
    // combination of the identifier. Multiple users can have the same email, phone
    // number. As the data of the same user is stored multiple times if the user login with
    // different identifier. This is not the ideal solution. We need the same mechanism
    // as the backend to identify the user.
    const uniqueUserIdentifier = commonHelpers.getUniqueUserIdentifier({
      userId,
      phoneNumber,
      userEmail,
      anonUserIdentifier
    });

    dispatch({
      type: ACTION_TYPES.FETCH_CONFIG_SUCCESS,
      config: response,
      currentTime,
      updateLs,
      browserIsMobile: browserUtils.isMobile(),
      helpshiftConfig,
      uniqueUserIdentifier
    });

    const {
      appState: {featuresEnabled, liteSdkConfig},
      ui: {
        uiConfig: {
          [HEADER_BG_COLOR]: {value: primaryColor},
          [CHAT_WIDGET_BG_COLOR]: {value: chatWidgetBgColor}
        }
      }
    } = store.getState();

    // Send the ui config change event to the client
    store.dispatch(
      postSdkMessage.onUiConfigChange({
        primaryColor: colorUtils.convertThreeToSixCharHexColorCode(primaryColor),
        chatWidgetBgColor: colorUtils.convertThreeToSixCharHexColorCode(chatWidgetBgColor)
      })
    );

    if (response.wm_widget_enabled) {
      // A side-effect of getting the web chat config would be to
      // add the stylesheet with the primary color (and any other
      // configurable CSS value) to the document head.
      // The `config loaded` event should be sent to the client after the CSS is loaded.
      setStyles({
        onSuccess: () => {
          dispatch(postSdkMessage.wmConfig(getClientWmConfig()));
        }
      });

      // Apply styles to page
      applyPageStyles();

      // Initialize conversation by either going to the out of business
      // hours view or by handling the chat view conversation.
      initializeConversation();

      // If the widget is enabled, track the widget load event
      // Do not track this event if the config was set via the reset flow.
      if (trigger !== TRIGGER.RESET) {
        analyticsHelpers.track(EVENT.WIDGET_LOAD);
      }

      if (!liteSdkConfig.os) {
        if (featuresEnabled.audioNotifications) {
          audioHelpers.init();
        } else {
          // Send the config event loaded back to the client
          dispatch(postSdkMessage.wmConfig(getClientWmConfig()));
        }
      }
    }
  };

  /**
   * Callback function for config failure
   * @param {object} data
   * @param {object} data.response - Config xhr success response
   * @param {string} data.trigger - The source that triggered setting the config
   * @param {Object} data.helpshiftConfig - The global client config object
   * @param {String} uniqueUserIdentifier - Unique identifier of a user
   */
  const _onConfigFailure = ({response, trigger, helpshiftConfig, uniqueUserIdentifier}) => {
    // If config fails and config is present in localstorage,
    // use localstorage config to load webchat
    const configFromLs = _getConfigFromLs(uniqueUserIdentifier);

    if (response.status === RESPONSE_STATUS_CODE.NO_AUTH_TOKEN || !configFromLs) {
      xhrHelpers.handleAuthFailure(response);
    } else {
      _onConfigSuccess({response: configFromLs, trigger, helpshiftConfig});
    }
  };

  /**
   * Action to get the config response either from backend or localstorage
   * @param {Object} data
   * @param {Object} data.callbacks - Config call success and failure callbacks
   * @param {string} data.trigger - The source that triggered setting the config
   * @param {Object} data.helpshiftConfig - The global client config object
   * @param {string} data.currentTime - Current time in milliseconds
   */
  const getConfig = ({callbacks, trigger, helpshiftConfig, currentTime}) => {
    return (dispatch, getState) => {
      // Rehydrate pfi and last config fetch timestamp from the local storage
      // This is done to check if the config should fetch from backend
      const {userId, phoneNumber, userEmail, anonUserIdentifier} = getState().appState;
      const uniqueUserIdentifier = commonHelpers.getUniqueUserIdentifier({
        userId,
        phoneNumber,
        userEmail,
        anonUserIdentifier
      });

      rehydrateState(uniqueUserIdentifier);

      const {issueExistsDataIsStaleInLocalStorage} = getState().appState;
      const {pfiValue, lastConfigFetchTs, respectPfi} = getState().appState;
      const configFromLs = _getConfigFromLs(uniqueUserIdentifier);
      const fetchConfigFromBackend = _shouldFetchConfig({
        pfiValue,
        lastConfigFetchTs,
        currentTime,
        respectPfi,
        configFromLs,
        issueExistsDataIsStaleInLocalStorage
      });

      if (fetchConfigFromBackend) {
        dispatch(_getConfigFromBackend({callbacks}));
      } else {
        _onConfigSuccess({response: configFromLs, trigger, helpshiftConfig});
      }
    };
  };

  /**
   * Action to set config object
   * @param {Object} data
   * @param {string} data.trigger - The source that triggered setting the config
   * @param {Object} data.helpshiftConfig - The global client config object
   */
  const setConfig = ({trigger, helpshiftConfig}) => {
    return (dispatch, getState) => {
      const {userId, phoneNumber, userEmail, anonUserIdentifier} = getState().appState;
      const uniqueUserIdentifier = commonHelpers.getUniqueUserIdentifier({
        userId,
        phoneNumber,
        userEmail,
        anonUserIdentifier
      });
      const currentTime = Date.now();
      const callbacks = {
        onSuccess: (response) => {
          _onConfigSuccess({response, trigger, helpshiftConfig, currentTime, updateLs: true});
        },
        onFailure: (response) => {
          _onConfigFailure({response, trigger, helpshiftConfig, uniqueUserIdentifier});
        }
      };

      dispatch(getConfig({callbacks, trigger, helpshiftConfig, currentTime}));
    };
  };

  /**
   * Returns launcher iframe's css configuration
   * @returns {Object} - css config
   */
  const getLauncherCssConfig = () => {
    const {
      ui: {uiConfig}
    } = store.getState();
    const launcherBgColor = uiConfig[HEADER_BG_COLOR].value;
    const focusRingColor = uiConfig[BASE_FOCUS_RING_COLOR].value;

    return {
      // Set to launcher icon background
      launcherBgColor,
      // Set to launcher icon background on hover
      launcherBgColorLight: uiHelpers.shadeColor(launcherBgColor, SHADES.LIGHT_20),
      // Set to launcher icon text i.e. chat and close icon
      launcherTextColor: uiConfig[HEADER_TEXT_COLOR].value,
      // Set to unread count background
      notificationBgColor: uiConfig[INITIAL_SECONDARY_BG_COLOR].value,
      // Set to unread count text i.e. unread count number
      notificationTextColor: uiConfig[INITIAL_SECONDARY_TEXT_COLOR].value,
      // Set launcher focus outline color
      focusRingColor
    };
  };

  /**
   * Return client relevant web chat config object
   * @param {Object} response - the GET wm config response object
   * @returns {Object} - the config object for client
   */
  const getClientWmConfig = () => {
    const {
      appState: {
        wcEnabled,
        widgetShouldAutoOpen,
        sdkConfigOptions: {fullScreen}
      },
      ui: {
        text: {ariaLabelOpenChat, ariaLabelCloseChat, ariaLabelLauncherBtnBadge}
      }
    } = store.getState();
    const hideWidget = commonHelpers.isWidgetHiddenOutOfBusinessHours();

    return {
      widgetEnabled: wcEnabled && !hideWidget,
      cssConfig: getLauncherCssConfig(),
      fullScreen,
      widgetShouldAutoOpen,
      translations: {
        ariaOpenWcLabel: ariaLabelOpenChat,
        ariaCloseWcLabel: ariaLabelCloseChat,
        ariaWcBadgeLabel: ariaLabelLauncherBtnBadge
      }
    };
  };

  /**
   * Get CSS over the wire, add it to the document and
   * update the custom CSS variables.
   * @param {Object} [callbacks]
   * @param {Function} [callbacks.onSuccess]
   */
  const setStyles = (callbacks = {}) => {
    getCss({
      onSuccess: (css) => {
        // Check if CSS variable is supported by the client. If yes,
        // use "style.setProperty" to update the CSS variables with the
        // configured values. If it's not supported (IE and Edge),
        // find and replace the CSS variable strings
        // (e.g. "var(--hs-custom-primary-color)" with the configured values.
        // The order of appending the CSS to the document and replacing the
        // variables depends on the support.
        // For supported browsers -
        // 1. Append the CSS to the document
        // 2. Replace the variables.
        // For unsupported browsers - the reverse.

        if (isCssVarSupported) {
          _addStyleToDocument(css);
          _updateCssVars();
        } else {
          const updatedCss = _getCssVarsUpdatedCss(css);
          _addStyleToDocument(updatedCss);
        }

        if (callbacks.onSuccess) {
          callbacks.onSuccess();
        }
      }
    });
  };

  /**
   * Get CSS string via an XHR.
   * @param {Object} - callbacks, the object typically with onSuccess, etc.
   */
  const getCss = (callbacks) => {
    xhr({
      route: routes.getCss(),
      parse: false,
      headers: xhrHelpers.getCommonHeaders(),
      onSuccess: (response) => {
        if (callbacks.onSuccess) {
          callbacks.onSuccess(response);
        }
      }
    });
  };

  /**
   * Post ui config updated event
   * This event is used to pass updated launcher styles to messenger js
   */
  const _postUiConfigUpdatedEvent = () => {
    store.dispatch(postSdkMessage.uiConfigUpdatedEvent(getLauncherCssConfig()));
  };

  /**
   * Create a style tag and add it to document's head.
   * @param {String} - css, a string with the CSS styles
   */
  // @TODO: Check if we should move this to a utility module, or a helper.
  const _addStyleToDocument = (css) => {
    const styleTagId = "hs-style";
    const head = document.head,
      style = document.createElement("style");

    style.type = "text/css";
    style.id = styleTagId;
    style.appendChild(document.createTextNode(css));

    // If existing style tag is present, remove it as we don't want two style
    // tags appended to head
    const existingStyles = document.getElementById(styleTagId);
    if (existingStyles) {
      // Post ui config event if existing style is present i.e. after updating
      // ui config and appending the new styles.
      // For the first time, do not post update event as launcher styles will be
      // updated throught sdk config loaded event.
      _postUiConfigUpdatedEvent();
      head.removeChild(existingStyles);
    }

    head.appendChild(style);
  };

  /**
   * Update CSS variables with the configured values and set the values in
   * the document's css.
   */
  const _updateCssVars = () => {
    const {uiConfig} = store.getState().ui;

    Object.keys(uiConfig).forEach((key) => {
      const {cssVarName, value} = uiConfig[key];

      document.body.style.setProperty(cssVarName, value);
    });
  };

  /**
   * Update and return the css string with variables
   * replaced by the configured values
   * @param {String} - css, the css string
   * @returns {String} - The replaced css string
   */
  const _getCssVarsUpdatedCss = (css) => {
    const {uiConfig} = store.getState().ui;
    const cssVarsRegexpList = [];
    const cssVarsValuesMap = {};

    Object.keys(uiConfig).forEach((key) => {
      const {cssVarName, value} = uiConfig[key];

      cssVarsRegexpList.push(`var\\(${cssVarName}\\)`);
      cssVarsValuesMap[`var(${cssVarName})`] = value;
    });

    return replaceAll(css, cssVarsRegexpList, cssVarsValuesMap);
  };

  /**
   * Find and replace all occurrences of a string by another string.
   *
   * Pass a list of regexp param strings with regexpList and an object with
   * the mapping of all the matches as key and the string that replaces
   * it as the value of the corresponding key in the valuesMap.
   *
   * @param {String} - str, the source string
   * @param {Array} - regexpList
   * @param {Object} - valuesMap
   * @returns {String} - the updated string
   */
  // @TODO: Move this to a gunpowder utility module.
  const replaceAll = (str, regexpList, valuesMap) => {
    const re = new RegExp(regexpList.join("|"), "gi");

    return str.replace(re, (matched) => {
      return valuesMap[matched.toLowerCase()];
    });
  };

  /**
   * Returns true if the intent tree SLA has elapsed.
   * @param {Number} intentsTreeSla - Intent tree SLA
   * @param {Number} lastFetchTime - Last fetch time of intents tree.
   * @returns {Boolean} - True if the intent tree SLA has elapsed.
   */
  const _hasIntentTreeSlaElapsed = (intentsTreeSla, lastFetchTime) => {
    return Date.now() - lastFetchTime < intentsTreeSla;
  };

  /**
   * Action to load intents tree and model data
   * @param {Object} [callbacks]
   * @param {Function} [callbacks.onIntentTreeSuccess] - Intents tree success callback
   * @returns {Function} - Action
   */
  const loadIntents = ({onIntentTreeSuccess} = {}) => {
    return (dispatch, getState) => {
      const {
        chatView: {
          intents: {
            tree: {lastFetchTime}
          }
        },
        appState: {featuresEnabled, intentsTreeSla}
      } = getState();

      // No need to fetch the intent tree again if it was last fetched within
      // the defined time period (intentsTreeSla)
      if (!featuresEnabled.intents) {
        return;
      }

      if (_hasIntentTreeSlaElapsed(intentsTreeSla, lastFetchTime)) {
        // If using the already fetched intents tree, call onIntentTreeSuccess callback
        if (onIntentTreeSuccess) {
          onIntentTreeSuccess();
        }

        return;
      }

      dispatch(
        chatViewActions.loadIntentsTree({
          onSuccess: () => {
            // @TODO: Intents: Check if we should clear the model related data before loading the
            // new data.
            if (onIntentTreeSuccess) {
              onIntentTreeSuccess();
            }

            dispatch(chatViewActions.loadIntentsModel());
          }
        })
      );
    };
  };

  /**
   * Action to start a new conversation.
   * A new conversation is started by -
   * adding the greeting message to the message list, if applicable, and
   * enabling the reply box
   *
   * @param {Object} config - Config object
   * @param {Boolean} config.resetSessionId - Whether to reset the session id or not.
   * @param {Boolean} config.shouldAddGreetingMessage - Whether to add greeting message or not
   */
  const startNewConversation = ({resetSessionId, shouldAddGreetingMessage = true}) => {
    return (dispatch, getState) => {
      const {
        featuresEnabled: {conversationHistory: conversationHistoryIsEnabled},
        sdkConfigOptions: {initialUserMessage}
      } = getState().appState;

      // This is applicable only for chat view (in business hours). For out of business hours
      // view, we load the business hours view first and when the user submits the form, we call
      // create a web issue.
      if (!commonHelpers.isOutOfBusinessHours()) {
        dispatch(conversationStarted(conversationHistoryIsEnabled));

        if (shouldAddGreetingMessage) {
          dispatch(chatViewActions.addGreetingMessage());
        }

        if (resetSessionId) {
          dispatch(updateAnalyticsSessionId());
        }

        // If initial user message is set via API, create preissue without waiting for end-user's
        // input. The initial user message once consumed should be reset - this is being handled in
        // the poller success callback, check actions/chatView -> handleResetInitialUserMessage.
        if (initialUserMessage) {
          dispatch(chatViewActions.createPreIssue());
        } else {
          // Load intents before starting the conversation.
          dispatch(
            loadIntents({
              onIntentTreeSuccess: () => {
                analyticsHelpers.track(EVENT.INTENT_TREE_SHOWN);
              }
            })
          );
        }
      }
    };
  };

  /**
   * Action to update the minimized flag.
   * @param {Boolean} minimized - Whether to set flag to true or false.
   * @returns {Object} - Action
   */
  const toggleMinimized = (minimized) => {
    return {
      type: ACTION_TYPES.TOGGLE_MINIMIZED,
      minimized
    };
  };

  /**
   * Action to replace the cifs
   * @param {Object} cif - data of cif
   * @returns {Object} - Action
   */
  const replaceCif = (cif) => {
    return {
      type: ACTION_TYPES.REPLACE_CIF,
      cif
    };
  };

  /**
   * Action to set parent (client) page's data - title, url, and origin
   * @param {Object} parentPageInfo - Parent page's data
   * @param {string} [parentPageInfo.title] - Title of the parent page
   * @param {string} [parentPageInfo.url] - URL of the parent page
   * @param {string} [parentPageInfo.origin] - Origin of the parent page
   * @returns {Object} - Action
   */
  const setParentPageInfo = (parentPageInfo) => {
    return {
      type: ACTION_TYPES.SET_PARENT_PAGE_INFO,
      parentPageInfo
    };
  };

  /**
   * Action to set the proactive chat rules in the state
   * @param {Object} proactiveChatRules
   * @returns {Object} - Action
   */
  const setProactiveChatRules = (proactiveChatRules) => {
    const processedProactiveChatRules = proactiveChatHelpers.getProcessedRules(proactiveChatRules);

    return {
      type: ACTION_TYPES.SET_PROACTIVE_CHAT_RULES,
      proactiveChatRules: processedProactiveChatRules
    };
  };

  /**
   * Action to execute the proactive chat rules.
   * @returns {Function} - Action
   */
  const executeProactiveChatRules = () => {
    return (dispatch, getState) => {
      const {proactiveChatRules} = getState().appState;

      proactiveChatRules.forEach((rule) => {
        proactiveChatHelpers.enqueue(rule);
      });
    };
  };

  /**
   * Update styles with new ui config
   */
  const updateStyles = () => {
    // If css variables are supported, directly update the vars
    if (isCssVarSupported) {
      _updateCssVars();
      _postUiConfigUpdatedEvent();
      return;
    }
    // Else load css file, replace placeholders with new values and append to
    // head
    setStyles();
  };

  /**
   * Reset preIssue by calling an API to reset the preIssue. On successful reset
   * reset the app's state, which in turn restarts the flow.
   */
  const resetPreIssue = () => {
    return (dispatch, getState) => {
      const {
        appState: {domain, activeIssueId}
      } = getState();

      dispatch(actionCreators.toggleChatViewLoading(true));
      xhr({
        route: routes.putResetPreIssue(domain, activeIssueId),
        data: xhrHelpers.getPreparedXhrData(
          {
            state: ISSUE_STATE_RESET
          },
          {
            skipPlatformId: true
          }
        ),
        method: "PUT",
        headers: xhrHelpers.getCommonHeaders(),
        onEnd: () => {
          // In both the cases (success and failure), we'll start with a new
          // conversation for the end user.
          dispatch(
            commonActions.reloadApp({
              trigger: APP_RESET_TRIGGER.PRE_ISSUE_RESET,
              callback: chatViewActions.stopPollingForMessages
            })
          );
        }
      });
    };
  };

  /**
   * Action to set re-engagement id
   * @param {String} id - re-engagement id
   * @returns {Object}
   */
  const setReEngagementId = (id) => ({
    type: ACTION_TYPES.SET_RE_ENGAGEMENT_ID,
    id
  });

  /**
   * Action to set the focus value of the window
   * @params {Boolean} windowIsFocused
   * @returns {Object} - Action object
   */
  const setWindowIsFocused = (windowIsFocused) => ({
    type: ACTION_TYPES.SET_WINDOW_IS_FOCUSED,
    windowIsFocused
  });

  /**
   * Abort get web chat config XHR if it's in progress
   */
  const abortGetConfigXhr = () => {
    // Check if get web chat config xhr is in progress. If so, abort it.
    if (getConfigXhr) {
      getConfigXhr.abort();
      getConfigXhr = null;
    }
  };

  /**
   * Handle the retry button click on chat view footer.
   *
   * @TODO: Move this to another module that handles errors globally. Although this action
   * handles the errors on the chat view footer, we can't keep this in actions/chatView. This
   * handler calls actions/appState's (this module's) action. Can't import this module in
   * actions/chatView because that imports this module causing a circular dependency. The
   * solution is to handle errors in a separate module.
   */
  const handleChatViewFooterRetry = () => {
    return (dispatch, getState) => {
      const errorType = getState().chatView.error.type;

      switch (errorType) {
        case ERROR_TYPES.PRE_ISSUE_FAILURE:
          // For non-specific errors with preissue creation, we assume that the preissue wasn't
          // created successfully, so we try to restart the conversation.
          dispatch(startNewConversation({resetSessionId: true, shouldAddGreetingMessage: false}));
          break;

        case ERROR_TYPES.PRE_ISSUE_TIME_OUT:
        default:
          // For network time-out and other unknown errors, start the poller. This fetches the
          // latest updates from the backend and web chat react safely based on the response. A
          // typical case if when create preissue API call returns a 504 response code but a
          // preissue is still created on the backend.
          chatViewActions.startPollingForMessages();
          break;
      }
    };
  };

  return {
    setDeviceId,
    setAnalyticsSessionId,
    setAnonUserId,
    setClientConfig,
    setConfig,
    toggleMinimized,
    startNewConversation,
    replaceCif,
    setParentPageInfo,
    setProactiveChatRules,
    executeProactiveChatRules,
    updateStyles,
    resetPreIssue,
    setReEngagementId,
    setWindowIsFocused,
    abortGetConfigXhr,
    handleChatViewFooterRetry
  };
});
