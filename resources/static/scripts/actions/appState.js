/**
 * App state related actions.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 7, 2017
 */

define ("actions/appState",
  [
    "constants/actionTypes",
    "constants/routes",
    "constants/appState",
    "constants/uiConfig",
    "constants/analytics",
    "constants/activeView",
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
    "utils/browser",
    "utils/dataType",
    "extras/postSdkMessage"
  ],
  function (ACTION_TYPES, routes, APP_STATE_CONSTANTS, UI_CONFIG_CONSTANTS,
    analyticsConstants, ACTIVE_VIEW, xhrHelpers, lsHelpers, audioHelpers, proactiveChatHelpers,
    uiHelpers, analyticsHelpers, commonHelpers, xhr, getUuid, store, chatViewActions,
    uiActions, batchActions, actionCreators, browserUtils, dataTypeUtils, postSdkMessage) {
    "use strict";

    const SKIP_PLATFORM_ID = true;

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
        BASE_COLOR,
        INITIAL_SECONDARY_BG_COLOR,
        INITIAL_SECONDARY_TEXT_COLOR
      },
      SHADES
    } = UI_CONFIG_CONSTANTS;
    const {EVENT} = analyticsConstants;

    const isCssVarSupported = (window.CSS && window.CSS.supports &&
                               window.CSS.supports ("--fake-var", 0));

    /**
     * Set the Device id value in the state/localstorage via an action.
     * If a value is present in the localstorage, keep using the same
     * value.
     */
    const setDeviceId = () => {
      return () => {
        let dId = lsHelpers.getDeviceId ();

        // Create a new device id if one doesn't exist already.
        // Set it in the local storage.
        if (!dId) {
          dId = getUuid ();
        }

        // Set the device id in the state.
        store.dispatch (setDeviceIdValue (dId));
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
        const currentAnonUserId = lsHelpers.getAnonUserId ();

        if (!currentAnonUserId) {
          const anonUserId = commonHelpers.getAnonUserId ();

          store.dispatch (setAnonUserIdValue (anonUserId));
          lsHelpers.setAnonUserId (anonUserId);
        } else {
          store.dispatch (setAnonUserIdValue (currentAnonUserId));
        }
      };
    };

    /**
     * Action to set conversation started
     * @returns {Object} - Action
     */
    const setConversationStarted = () => {
      return {
        type: ACTION_TYPES.SET_CONVERSATION_STARTED
      };
    };

    /**
     * Action to set conversation ended
     * @returns {Object} - Action
     */
    const setConversationEnded = () => {
      return {
        type: ACTION_TYPES.SET_CONVERSATION_ENDED
      };
    };

    /**
     * Either starts a new conversation or handle previous one.
     */
    const startConversation = () => {
      return (dispatch, getState) => {
        const {
          appState: {
            issueExists
          }
        } = getState ();

        dispatch (setConversationStarted ());

        // If an issue exists, the poller would have started already with the
        // success callback of setIssueState via get config.
        // Only for new user, start a new conversation. Rest of the cases will be
        // handled on click of 'start new conversation' button which will call reset.
        if (!issueExists) {
          startNewConversation ();
        }
      };
    };

    /**
     * Action to reset the conversation.
     * It does the following tasks:
     * - Stop polling for agent messages.
     * - Dispatch action to reset the store.
     * - Post reset message to parent.
     * - Clear localstorage.
     * - Minimize widget if options.minimizeMessenger is true.
     * @param {Object} [options]
     * @param {Boolean} [options.resetProactiveChat] - Whether to reset proactive
     *                  chat related data or not. By default, they would NOT be reset.
     * @param {Boolean} [options.minimizeMessenger] - Whether to minimize the widget or not.
     *                                                Defaults to false.
     */
    const reset = (options = {}) => {
      return (dispatch, getState) => {
        chatViewActions.stopPollingForMessages ();
        dispatch (setConversationEnded ());
        dispatch (actionCreators.reset ());
        postSdkMessage.reset ();
        lsHelpers.reset ({
          resetProactiveChat: options.resetProactiveChat
        });

        const {minimized} = getState ().appState;
        if (options.minimizeMessenger && !minimized) {
          postSdkMessage.toggleMessenger (true);
        }
      };
    };

    /**
     * Rehydrate the state with localstorage data, if applicable.
     * Although we get the state data from backend for continuing the conversation,
     * there are some values that are web chat client specific and need to be
     * added back to the state. For example - which FAQs have been read by the
     * user so far.
     */
    const rehydrateState = () => {
      const suggestedFaqReadTracked = lsHelpers.getSuggestedFaqReadTracked (),
            readFaqList = lsHelpers.getReadFaqList ();

      store.dispatch ({
        type: ACTION_TYPES.REHYDRATE,
        data: {
          suggestedFaqReadTracked,
          readFaqList
        }
      });
    };

    /**
     * Return tags array containing string values converted to lowercase
     * @param {Any} - Unprocessed tags
     * @returns {(Array|null)} - Processed tags containing only string values
     *                           converted to lowercase
     */
    const getProcessedTags = function (tags) {
      let validTags = null;

      // Tags must be a non empty array
      if (Array.isArray (tags) && tags.length) {
        validTags = tags.filter ((tag) => {
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
      const {
        tags,
        userId,
        userEmail,
        clearAnonymousUserOnLogin,
        userName,
        language
      } = config;

      const {
        isUserIdValid,
        isEmailValid
      } = commonHelpers;

      // Filter string values and convert to lower case
      config.tags = getProcessedTags (tags);

      // If userId is passed, validate it.
      // If userEmail is passed, validate it.
      // If either of the two is passed and is invalid, drop both the values.
      if (
        (userId && !isUserIdValid (userId)) ||
        (userEmail && !isEmailValid (userEmail))
      ) {
        delete config.userId;
        delete config.userEmail;
        // @TODO: Check with product if we need to throw an error for the client
        // developer to know about this.
      }

      // User's names are to be truncated if they are more than 255 chars.
      if (userName) {
        config.userName = userName.slice (0, 255);
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
      handleAnonUserReset (config.userId, clearAnonymousUserOnLogin);

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
     * @param {string} userId - The userId value passed with `helpshiftConfig`.
     * @param {boolean} clearAnonymousUserOnLogin
     */
    const handleAnonUserReset = (userId, clearAnonymousUserOnLogin) => {
      // Clear anon user id after 7 days of inactivity
      const lastActivityTime = lsHelpers.getLastActivityTime ();
      const inactivityDuration = Date.now () - lastActivityTime;

      if (lastActivityTime && inactivityDuration > ANON_USER_RESET_TIMEOUT) {
        lsHelpers.removeAnonUserId ();
      }

      // Clear anon user if a user logs in and clearAnonymousUserOnLogin flag is true
      if (
        !commonHelpers.isUserIdValid (userId) ||
        !clearAnonymousUserOnLogin
      ) {
        return;
      }

      const previousUserId = lsHelpers.getUserId ();

      if (userId !== previousUserId) {
        // If previousUserId is not present,
        // anon user -> a user logged in
        // If previousUserId is present,
        // A user was logged in -> they logged out -> a new user logged in.
        lsHelpers.removeAnonUserId ();
      }
    };

    /**
     * Apply styles to hs-page
     */
    const applyPageStyles = () => {
      const {appState} = store.getState ();
      const page = document.querySelector (".hs-page");

      if (appState.browserIsMobile) {
        page.classList.add ("hs-page--mobile");
      }

      if (appState.sdkConfigOptions.fullScreen) {
        page.classList.add ("hs-page--full-screen");
      }
    };

    /**
     * Set UI configuration in the state using the configuration set in the admin
     * dashboard and by the custom configuration passed with helpshiftConfig.
     * @param {Object} helpshiftConfig - The global client config object
     */
    const setUiConfig = (helpshiftConfig) => {
      const {
        ui: {
          uiConfig,
          developerUiConfig
        }
      } = store.getState ();

      let finalUiConfig;

      // If ui config is passed in helpshift config options, use that
      // Else use previously set developer config
      // Else create a ui config having base color set from dashboard
      if (dataTypeUtils.isObject (helpshiftConfig.uiConfig) &&
          Object.keys (helpshiftConfig.uiConfig).length) {
        finalUiConfig = helpshiftConfig.uiConfig;
      } else if (developerUiConfig) {
        finalUiConfig = developerUiConfig;
      } else {
        const baseData = BASE_COLOR.split (".");
        // name of base set
        const baseSet = baseData [0];
        // value of base set
        const baseValue = baseData [1];

        finalUiConfig = {
          [baseSet]: {
            [baseValue]: uiConfig [BASE_COLOR].value
          }
        };
      }
      store.dispatch (uiActions.setUiConfig (finalUiConfig));
      store.dispatch (uiActions.setDeveloperUiConfig (finalUiConfig));
    };

    /**
     * Action to set app reset trigger
     * @param {String} value - value of reset trigger
     * @returns {Object} - Action
     */
    const setAppResetTrigger = (value) => {
      return {
        type: ACTION_TYPES.SET_APP_RESET_TRIGGER,
        value
      };
    };

    /**
     * Initialize conversation - either enable the chat view or the out of
     * business hours view.
     */
    const initializeConversation = () => {
      const {dispatch, getState} = store;
      // If business hours is enabled and it's out of business hours currently,
      // show out of business hours view
      if (commonHelpers.isOutOfBusinessHours ()) {
        dispatch (
          actionCreators.updateActiveView (ACTIVE_VIEW.BUSINESS_HOURS)
        );
      } else {
        // The active view is set to chat view by default. If we are not handling
        // the out of business hours case, we need to start the conversation on the
        // chat view.
        const {
          appState: {
            issueExists,
            appResetTrigger,
            minimized
          }
        } = getState ();
        const widgetIsOpen = !minimized;

        // If atleast one issue exists on backend then start the poller.
        // (poller will check for issue state)
        // Else start a new conversation by creating new preIssue.

        // App reset trigger is used to determine way by which app has been reset.
        // We have to handle app reset scenarios differently.
        // If app reset is triggered by
        // 1. preIssue reset conditions and widget is open
        //    OR
        // 2. clicking start new conversation button
        //    OR
        // 3. update helpshift config api and widget is open and issue does not
        //    exist i.e. new user
        // Then explicitly create a new preIssue.
        // OR
        // If issue exists for a user, then start the poller.
        if (
          (appResetTrigger === APP_RESET_TRIGGER.PRE_ISSUE_RESET && widgetIsOpen) ||
          (appResetTrigger === APP_RESET_TRIGGER.START_NEW_CONVERSATION) ||
          (appResetTrigger === APP_RESET_TRIGGER.UPDATE_HELPSHIFT_CONFIG_API &&
           widgetIsOpen && !issueExists)
        ) {
          startNewConversation ();
        } else if (issueExists) {
          chatViewActions.startPollingForMessages ();
        }

        // The reset trigger is reset to its default value once appropriate
        // action is performed.
        dispatch (setAppResetTrigger (APP_RESET_TRIGGER.INITIAL));
      }
    };

    /**
     * Action to set the web chat configuration set by the Helpshift admin
     * and set it to the store. Post message to the client with the config.
     * This configuration contains settings like if web chat is enabled,
     * appearance, etc.
     * @param {Object} options
     * @param {string} options.trigger - The source that triggered setting the config
     * @param {Object} options.helpshiftConfig - The global client config object
     */
    const setWmConfig = ({trigger, helpshiftConfig}) => {
      return (dispatch, getState) => {
        const state = getState ();
        const {domain} = state.appState;

        getWmConfig (domain, {
          onSuccess: (response) => {
            dispatch (
              batchActions ([
                // Set the config values to the store
                setWmConfigValues (response),
                actionCreators.setMobileInfo (browserUtils.isMobile ()),
                setUiTextValues (response)
              ])
            );

            const {
              appState: {
                featuresEnabled,
                wcEnabled
              }
            } = store.getState ();

            // Set the ui configuration flags in the state.
            setUiConfig (helpshiftConfig);

            // Send the config event loaded back to the client
            postSdkMessage.wmConfig (getClientWmConfig ());

            if (wcEnabled) {
              // A side-effect of getting the web chat config would be to
              // add the stylesheet with the primary color (and any other
              // configurable CSS value) to the document head.
              setStyles ();

              // Apply styles to page
              applyPageStyles ();

              // Rehydrate the state with localstorage data if applicable
              rehydrateState ();

              // Initialize conversation by either going to the out of business
              // hours view or by handling the chat view conversation.
              initializeConversation ();

              // If the widget is enabled, track the widget load event
              // Do not track this event if the config was set via the reset flow.
              if (trigger !== TRIGGER.RESET) {
                analyticsHelpers.track (EVENT.WIDGET_LOAD);
              }

              if (featuresEnabled.audioNotifications) {
                audioHelpers.init ();
              }
            }
          },
          onFailure: (response) => {
            xhrHelpers.handleAuthFailure (response);
          }
        });
      };
    };

    /**
     * Get web chat config via the HS API.
     * @param {string} domain
     * @param {Object} callbacks - callbacks passed by the caller e.g. onSuccess
     */
    const getWmConfig = (domain, callbacks) => {
      // IE 11 caches config call which causes new preIssues to be created for
      // new user. In order to invalidate browser cache we are sending a new
      // timestamp in every request.
      const requestData = xhrHelpers.getPreparedXhrData ();
      requestData.nonce = Date.now ();

      xhr ({
        route: routes.getWmConfig (domain),
        headers: xhrHelpers.getCommonHeaders (),
        data: requestData,
        onSuccess: callbacks.onSuccess,
        onFailure: callbacks.onFailure
      });
    };

    /**
     * Returns launcher iframe's css configuration
     * @returns {Object} - css config
     */
    const getLauncherCssConfig = () => {
      const {ui: {uiConfig}} = store.getState ();
      const launcherBgColor = uiConfig [HEADER_BG_COLOR].value;

      return {
        // Set to launcher icon background
        launcherBgColor,
        // Set to launcher icon background on hover
        launcherBgColorLight: uiHelpers.shadeColor (
          launcherBgColor, SHADES.LIGHT_20
        ),
        // Set to launcher icon text i.e. chat and close icon
        launcherTextColor: uiConfig [HEADER_TEXT_COLOR].value,
        // Set to unread count background
        notificationBgColor: uiConfig [INITIAL_SECONDARY_BG_COLOR].value,
        // Set to unread count text i.e. unread count number
        notificationTextColor: uiConfig [INITIAL_SECONDARY_TEXT_COLOR].value
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
          sdkConfigOptions: {
            fullScreen
          }
        }
      } = store.getState ();
      const hideWidget = commonHelpers.isWidgetHiddenOutOfBusinessHours ();

      return {
        widgetEnabled: wcEnabled && !hideWidget,
        cssConfig: getLauncherCssConfig (),
        fullScreen
      };
    };

    /**
     * Action to set wm config to the store.
     * @param {Object} config
     * @returns {Object} - action
     */
    const setWmConfigValues = (config) => ({
      type: ACTION_TYPES.SET_WM_CONFIG,
      config
    });

    /**
     * Action to set UI strings in the store
     * @param {Object} config
     * @returns {Object} - action
     */
    const setUiTextValues = (config) => ({
      type: ACTION_TYPES.SET_UI_TEXT,
      text: config.translations
    });

    /**
     * Get CSS over the wire, add it to the document and
     * update the custom CSS variables.
     */
    const setStyles = () => {
      getCss ({
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
            _addStyleToDocument (css);
            _updateCssVars ();
          } else {
            const updatedCss = _getCssVarsUpdatedCss (css);
            _addStyleToDocument (updatedCss);
          }
        }
      });
    };

    /**
     * Get CSS string via an XHR.
     * @param {Object} - callbacks, the object typically with onSuccess, etc.
     */
    const getCss = (callbacks) => {
      xhr ({
        route: routes.getCss (),
        parse: false,
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
          if (callbacks.onSuccess) {
            callbacks.onSuccess (response);
          }
        }
      });
    };

    /**
     * Post ui config updated event
     * This event is used to pass updated launcher styles to messenger js
     */
    const _postUiConfigUpdatedEvent = () => {
      postSdkMessage.uiConfigUpdatedEvent (getLauncherCssConfig ());
    };

    /**
     * Create a style tag and add it to document's head.
     * @param {String} - css, a string with the CSS styles
     */
    // @TODO: Check if we should move this to a utility module, or a helper.
    const _addStyleToDocument = (css) => {
      const styleTagId = "hs-style";
      const head = document.head,
            style = document.createElement ("style");

      style.type = "text/css";
      style.id = styleTagId;
      style.appendChild (document.createTextNode (css));

      // If existing style tag is present, remove it as we don't want two style
      // tags appended to head
      const existingStyles = document.getElementById (styleTagId);
      if (existingStyles) {
        // Post ui config event if existing style is present i.e. after updating
        // ui config and appending the new styles.
        // For the first time, do not post update event as launcher styles will be
        // updated throught sdk config loaded event.
        _postUiConfigUpdatedEvent ();
        head.removeChild (existingStyles);
      }

      head.appendChild (style);
    };

    /**
     * Update CSS variables with the configured values and set the values in
     * the document's css.
     */
    const _updateCssVars = () => {
      const {uiConfig} = store.getState ().ui;

      Object.keys (uiConfig).forEach ((key) => {
        const {cssVarName, value} = uiConfig [key];

        document.body.style.setProperty (
          cssVarName, value
        );
      });
    };

    /**
     * Update and return the css string with variables
     * replaced by the configured values
     * @param {String} - css, the css string
     * @returns {String} - The replaced css string
     */
    const _getCssVarsUpdatedCss = (css) => {
      const {uiConfig} = store.getState ().ui;
      const cssVarsRegexpList = [];
      const cssVarsValuesMap = {};

      Object.keys (uiConfig).forEach ((key) => {
        const {cssVarName, value} = uiConfig [key];

        cssVarsRegexpList.push (`var\\(${cssVarName}\\)`);
        cssVarsValuesMap [`var(${cssVarName})`] = value;
      });

      return replaceAll (css, cssVarsRegexpList, cssVarsValuesMap);
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
      const re = new RegExp (regexpList.join ("|"), "gi");

      return str.replace (re, (matched) => {
        return valuesMap [matched.toLowerCase ()];
      });
    };

    /**
     * Action to start new conversation.
     * Creates preIssue (or issue, for out of business hours) on the backend
     * @returns {Function} - action.
     */
    const startNewConversation = () => {
      // This is applicable only for chat view (in business hours). For out of business hours
      // view, we load the business hours view first and when the user submits the form, we call
      // create a web issue.
      if (!commonHelpers.isOutOfBusinessHours ()) {
        store.dispatch (setConversationStarted ());
        store.dispatch (chatViewActions.createPreIssue ());
      }
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
     * Action to set initial user message in store
     * @param {String} - message
     * @returns {Object} - Action
     */
    const setInitialUserMsg = (message) => {
      return {
        type: ACTION_TYPES.SET_INITIAL_USER_MESSAGE,
        message
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
      const processedProactiveChatRules = proactiveChatHelpers.getProcessedRules (
        proactiveChatRules
      );

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
        const {proactiveChatRules} = getState ().appState;

        proactiveChatRules.forEach ((rule) => {
          proactiveChatHelpers.enqueue (rule);
        });
      };
    };

    /**
     * Update styles with new ui config
     */
    const updateStyles = () => {
      // If css variables are supported, directly update the vars
      if (isCssVarSupported) {
        _updateCssVars ();
        _postUiConfigUpdatedEvent ();
        return;
      }
      // Else load css file, replace placeholders with new values and append to
      // head
      setStyles ();
    };

    /**
     * Reset preIssue by calling an API to reset the preIssue. On successful reset
     * reset the app's state, which in turn restarts the flow.
     */
    const resetPreIssue = () => {
      return (dispatch, getState) => {
        const {
          appState: {
            domain,
            activeIssueId
          }
        } = getState ();

        dispatch (actionCreators.toggleChatViewLoading (true));
        xhr ({
          route: routes.putResetPreIssue (domain, activeIssueId),
          data: xhrHelpers.getPreparedXhrData ({
            state: ISSUE_STATE_RESET
          }, SKIP_PLATFORM_ID),
          method: "PUT",
          headers: xhrHelpers.getCommonHeaders (),
          onEnd: () => {
            dispatch (setAppResetTrigger (APP_RESET_TRIGGER.PRE_ISSUE_RESET));
            // In both the cases (success and failure), we'll start with a new
            // conversation for the end user.
            dispatch (reset ());
          }
        });
      };
    };

    /**
     * Action to set the value in the state which represents whether
     * the widget should auto open after config has been fetched.
     * @param {Boolean} widgetShouldAutoOpen - default is true
     * @returns {Object}
     */
    const setWidgetShouldAutoOpen = (widgetShouldAutoOpen = true) => ({
      type: ACTION_TYPES.SET_WIDGET_SHOULD_AUTO_OPEN,
      widgetShouldAutoOpen
    });

    /**
     * Action to set re-engagement id
     * @param {String} id - re-engagement id
     * @returns {Object}
     */
    const setReEngagementId = (id) => ({
      type: ACTION_TYPES.SET_RE_ENGAGEMENT_ID,
      id
    });

    return {
      setDeviceId,
      setAnonUserId,
      setClientConfig,
      setWmConfig,
      toggleMinimized,
      reset,
      setInitialUserMsg,
      startConversation,
      replaceCif,
      setParentPageInfo,
      setProactiveChatRules,
      executeProactiveChatRules,
      updateStyles,
      resetPreIssue,
      setConversationStarted,
      setAppResetTrigger,
      setWidgetShouldAutoOpen,
      setReEngagementId
    };
  });
