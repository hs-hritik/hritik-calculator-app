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
    "constants/chatView",
    "constants/uiConfig",
    "constants/analytics",
    "constants/activeView",
    "normalizr",
    "helpers/entitySchema",
    "helpers/entity",
    "helpers/xhr",
    "helpers/localStorage",
    "helpers/prepareProcessXhrData",
    "helpers/audio",
    "helpers/proactiveChat",
    "helpers/ui",
    "helpers/analytics",
    "helpers/common",
    "gunpowder/utils/xhr",
    "gunpowder/utils/object",
    "gunpowder/utils/uuid",
    "gunpowder/utils/array",
    "store",
    "actions/entities",
    "actions/chatView",
    "actions/ui",
    "actions/batch",
    "actions/actionCreators",
    "utils/postMessage",
    "utils/browser",
    "utils/dataType",
    "extras/postSdkMessage"
  ],
  function (ACTION_TYPES, routes, APP_STATE_CONSTANTS, CHAT_VIEW_CONSTANTS,
    UI_CONFIG_CONSTANTS, analyticsConstants, ACTIVE_VIEW, normalizr, entitySchema,
    entityHelpers, xhrHelpers, lsHelpers, prepareProcessXhrDataHelpers, audioHelpers,
    proactiveChatHelpers, uiHelpers, analyticsHelpers, commonHelpers, xhr, objUtils,
    getUuid, arrayUtils, store, entitiesActions, chatViewActions, uiActions,
    batchActions, actionCreators, postMessage, browserUtils, dataTypeUtils, postSdkMessage) {
    "use strict";

    const {normalize} = normalizr;
    const {
      ISSUE_STATE,
      DEFAULT_RESET_TIMEOUT,
      MIN_RESET_TIMEOUT,
      MAX_RESET_TIMEOUT,
      PRE_CHAT_STATE,
      PRE_CHAT_FEATURES,
      TRIGGER
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

    const {getPreparedDeviceInfo} = prepareProcessXhrDataHelpers;

    let returningUser = false;

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
     *
     * A user is identified by one the following two identifiers -
     * 1. userId
     *    - passed with the helpshiftConfig object
     *    - denotes a "logged in user"
     *    - is stored in localstorage (persisted across page reloads)
     * 2. anonUserIdentifier
     *    - created for anonymous (non-logged-in) user
     *    - is associated with the "default profile"
     *    - has a special format (hsft_anon_<timestamp>_<15 random characters>)
     *    - is stored in localstorage (persisted across page reloads)
     *
     * Web Chat communicates with backend with either of the two values (with the
     * `uid` key with APIs).
     * `userId` always means the value passed with helpshiftConfig. This value
     * gets set in the state and the localstorage with the SET_CLIENT_CONFIG action.
     */
    const setAnonUserId = () => {
      return () => {
        const anonUserId = commonHelpers.getAnonUserId ();
        dispatchAndSetAnonUserId (anonUserId);
      };
    };

    /**
     * Dispatch and set the anon user id in the app state and localstorage respectively.
     * Checks localstorage if an anon user id already exists.
     * If it does, it gets the value from the ls and sets it in the
     * state while not affecting ls at all.
     * If it does not exist, it sets a new value (`anonUserId`) in state
     * and localstorage.
     *
     * @param {string} anonUserId - Identifier for the anon user.
     */
    const dispatchAndSetAnonUserId = (anonUserId) => {
      const currentAnonUserId = lsHelpers.getAnonUserId ();

      if (!currentAnonUserId) {
        store.dispatch (setAnonUserIdValue (anonUserId));
        lsHelpers.setAnonUserId (anonUserId);

        // @TODO: Double check this with the updated business logic.
        // If we are saving a new identifier, that means it's a new user.
        returningUser = false;
      } else {
        store.dispatch (setAnonUserIdValue (currentAnonUserId));

        // @TODO: Double check this with the updated business logic.
        // If we are using the already saved identifier,
        // that means it's a returning user.
        returningUser = true;
      }
    };

    /**
     * Initialize Web Chat by setting issue details to the state. This function
     * is triggered by the client once it's done processing the config via the
     * CMD_INITIALIZE event.
     *
     * After Web Chat gets the configuration from the backend, it needs to
     * determine whether an active issue exists for the profile so that it can
     * either start polling for messages (if issue exists) or wait for the
     * web chat widget to open, in which case a pre-issue gets created.
     * This function is to set issue details in the state.
     */
    const initialize = () => {
      const {
        appState: {
          wcEnabled
        }
      } = store.getState ();

      if (!wcEnabled || commonHelpers.isOutOfBusinessHours ()) {
        return;
      }

      store.dispatch (setIssueState ());
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
      store.dispatch (setConversationStarted ());
      if (returningUser) {
        // If it's a returning user, that means there could be an
        // ongoing conversation.
        handleOngoingConversation ();
      } else {
        // If it's a new user, start a new conversation.
        store.dispatch (startNewConversation ());
      }
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
     * @param {Boolean} [options.skipUser] - Whether to skip resetting for user related data.
     *                  By default, user related data will be reset.
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
          skipUser: options.skipUser,
          resetProactiveChat: options.resetProactiveChat
        });

        const {minimized} = getState ().appState;
        if (options.minimizeMessenger && !minimized) {
          postSdkMessage.toggleMessenger (true);
        }
      };
    };

    /**
     * Handle ongoing conversation.
     * @TODO: This function will need clean up with the chat bots changes.
     */
    const handleOngoingConversation = () => {
      const issueState = lsHelpers.getIssueState ();
      switch (issueState) {
        case ISSUE_STATE.PRE_CHAT:
          cleanUpAndRehydrate ();
          store.dispatch (chatViewActions.startPreChatFeature ());
          break;

        case ISSUE_STATE.RESOLVED:
        case ISSUE_STATE.ACTIVE:
          const activeIssueId = lsHelpers.getActiveIssueId ();
          const internalIssueId = lsHelpers.getInternalIssueId ();

          if (internalIssueId) {
            store.dispatch (actionCreators.setInternalIssueId (internalIssueId));
          }

          // If there is an active issue id in localstorage, set the activeIssueId in state,
          // and start polling for new messages.
          if (activeIssueId) {
            cleanUpAndRehydrate ();
            store.dispatch (chatViewActions.setActiveIssueId (activeIssueId));
            chatViewActions.startPollingForMessages ();
          } else {
            // Ideally, this shouldn't be the case because we are first setting the
            // active issue id, and then we are changing the issue state to active.
            // But to be on safer side, start new conversation if there is no active issue id.
            store.dispatch (startNewConversation ());
          }
          break;

        case ISSUE_STATE.REJECTED:
        case ISSUE_STATE.RESOLVED_BY_FAQ_SUGGESTIONS:
          // For post chat state, start new conversation.
          store.dispatch (startNewConversation ());
          break;

        default:
          // If there is no issueState data in ls, start new conversation.
          store.dispatch (startNewConversation ());
          break;
      }
    };

    /**
     * Cleans up dummy messages and rehydrate the data from localStorage
     */
    const cleanUpAndRehydrate = () => {
      lsHelpers.removeDummyMessages ();
      rehydrate ();
    };

    /**
     * Get saved data from localstorage,
     * and call action to update the current state.
     */
    const rehydrate = () => {
      const issues = lsHelpers.getEntities ("ISSUES"),
            messages = lsHelpers.getEntities ("MESSAGES"),
            preChatFeatureIndex = lsHelpers.getPreChatFeatureIndex (),
            preChatFeatureState = lsHelpers.getPreChatFeatureState (),
            infoBotCurrentField = lsHelpers.getInfoBotCurrentField (),
            issueState = lsHelpers.getIssueState (),
            userProfileId = lsHelpers.getUserProfileId (),
            replyText = lsHelpers.getReplyText (),
            endUserFirstMsgId = lsHelpers.getEndUserFirstMsgId (),
            suggestedFaqReadTracked = lsHelpers.getSuggestedFaqReadTracked (),
            conversationId = lsHelpers.getConversationId (),
            readFaqList = lsHelpers.getReadFaqList (),
            infoBotRequestedTimestamp = lsHelpers.getInfoBotRequestedTimestamp ();

      // Handle greeting message prechat feature for proactive chat
      // If the current prechat feature is `initial user message` and its state
      // is not completed, rerun the greeting message prechat feature.
      const {appState} = store.getState ();
      const currentPreChatFeature = appState.preChatFeatureOrder [preChatFeatureIndex];
      const initialUserMessageFeatureState = preChatFeatureState.initialUserMessage;

      const executeGreetingPreChatFeature = (
        (currentPreChatFeature === PRE_CHAT_FEATURES.INITIAL_USER_MESSAGE) &&
        (initialUserMessageFeatureState !== PRE_CHAT_STATE.initialUserMessage.COMPLETED)
      );

      if (issues || messages) {
        store.dispatch ({
          type: ACTION_TYPES.REHYDRATE,
          data: {
            entities: {
              issues,
              messages
            },
            preChatFeatureIndex,
            preChatFeatureState,
            executeGreetingPreChatFeature,
            infoBotCurrentField,
            issueState,
            replyText,
            userProfileId,
            endUserFirstMsgId,
            suggestedFaqReadTracked,
            conversationId,
            readFaqList,
            infoBotRequestedTimestamp
          }
        });
      }
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
     * Return resetTimeout value to be set in the state by converting the
     * passed value, in hours, to milliseconds.
     * @param {number} - Reset timeout passed with client config (in hours)
     * @returns {number} - Reset timeout value to be set in the state
     */
    const getProcessedResetTimeout = function (timeout) {
      if (typeof timeout === "number") {
        let effectiveTimeout = timeout;

        // If the passed value is less than the minimum possible value or greater
        // than the maximum possible value of reset timeout, then set it to the
        // min or max value, respectively.
        if (timeout < MIN_RESET_TIMEOUT) {
          effectiveTimeout = MIN_RESET_TIMEOUT;
        } else if (timeout > MAX_RESET_TIMEOUT) {
          effectiveTimeout = MAX_RESET_TIMEOUT;
        }

        // x hours = x * 60 * 60 * 1000 milliseconds
        return effectiveTimeout * 3600000;
      }

      // If an invalid timeout is passed, return the default reset timeout
      return DEFAULT_RESET_TIMEOUT;
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
      // Filter string values and convert to lower case
      config.tags = getProcessedTags (config.tags);

      // Get the resetTimeout value to be set in the state
      config.resetTimeout = getProcessedResetTimeout (config.resetTimeout);

      return {
        type: ACTION_TYPES.SET_CLIENT_CONFIG,
        config
      };
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
     * Initialize conversation - either enable the chat view or the out of
     * business hours view.
     */
    const initializeConversation = () => {
      const {
        appState: {
          conversationStarted
        }
      } = store.getState ();

      // If business hours is enabled and it's out of business hours currently,
      // show out of business hours view
      if (commonHelpers.isOutOfBusinessHours ()) {
        store.dispatch (
          actionCreators.updateActiveView (ACTIVE_VIEW.BUSINESS_HOURS)
        );
      } else if (!conversationStarted) {
        // The active view is set to chat view by default. If we are not handling
        // the out of business hours case, we need to start the conversation on the
        // chat view.
        // @TODO - revisit start conversation after conversation data is moved to backend
        startConversation ();
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
        const {domain, platformId} = state.appState;

        getWmConfig (domain, platformId, {
          onSuccess: (response) => {
            dispatch (
              batchActions ([
                // Set the config values to the store
                setWmConfigValues (response),
                actionCreators.setMobileInfo (browserUtils.isMobile ())
              ])
            );

            const {
              appState: {
                featuresEnabled,
                wcEnabled
              }
            } = store.getState ();

            // Send the config event loaded back to the client
            postSdkMessage.wmConfig (getClientWmConfig ());

            if (wcEnabled) {
              // Set the ui configuration flags in the state.
              setUiConfig (helpshiftConfig);

              // A side-effect of getting the web chat config would be to
              // add the stylesheet with the primary color (and any other
              // configurable CSS value) to the document head.
              setStyles ();

              // Apply styles to page
              applyPageStyles ();

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
     * @param {string} platformId
     * @param {Object} callbacks - callbacks passed by the caller e.g. onSuccess
     */
    const getWmConfig = (domain, platformId, callbacks) => {
      xhr ({
        route: routes.getWmConfig (domain, platformId),
        headers: xhrHelpers.getCommonHeaders (),
        data: xhrHelpers.getPreparedXhrData (),
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
          browserIsMobile,
          wcEnabled
        }
      } = store.getState ();
      const hideWidget = commonHelpers.isWidgetHiddenOutOfBusinessHours ();

      return {
        widgetEnabled: wcEnabled && !hideWidget,
        browserIsMobile: browserIsMobile,
        cssConfig: getLauncherCssConfig ()
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
     * Find active issue in the given issues object,
     * and return the active issue id.
     * If there is no active issue, return null.
     * @param {Object} issues - issues entity.
     * @returns {string|null} - active issue id or null
     */
    const _getActiveIssueId = (issues) => {
      // @TODO: Update it depending on how are we going to handle pre-issues.
      let activeIssueId = null;

      objUtils.forEachKey (issues, (id, issue) => {
        if (_isIssueInProgress (issue.state_data.state)) {
          activeIssueId = id;
        }
      });

      return activeIssueId;
    };

    /**
     * Returns true if the issue is in progress.
     * Any issue that is not "resolved" or "rejected" is considered in progress.
     * @param {String} state - issue state.
     * @returns {Boolean} - true, if the issue is in progress.
     */
    const _isIssueInProgress = (state) => {
      return (state !== "resolved" && state !== "rejected");
    };

    /**
     * Action to start new conversation.
     * Reset the previous localstorage data (if any).
     * Creates pre-issue on the backend.
     * @returns {Function} - action.
     */
    const startNewConversation = () => {
      return (dispatch) => {
        // @TODO: Check if resetting localstorage is applicable.
        lsHelpers.reset ({
          skipUser: true
        });

        // Create pre-issue
        dispatch (chatViewActions.createPreIssue ());
      };
    };

    /**
     * Action to set issue state in the state. Gets all the issues first via the
     * GET issues API and then sets the issue details from its response.
     * @returns {Object} - action
     */
    const setIssueState = () => {
      return (dispatch) => {
        getIssues ({
          onSuccess: (response) => {
            const normalizedData = normalize (response, entitySchema.issues);
            const processedEntities = entityHelpers.getProcessedEntities (
              normalizedData.entities
            );

            dispatch (entitiesActions.setEntities (processedEntities));

            const activeIssueId = _getActiveIssueId (processedEntities.issues);

            // @TODO: Handle active pre-issue as well.
            if (activeIssueId) {
              dispatch (
                batchActions ([
                  chatViewActions.setActiveIssueId (activeIssueId),
                  // @TODO: Set internal issue id to the long issue id
                  // of the issue, e.g. test_issue_123456.
                  actionCreators.setInternalIssueId (activeIssueId),
                  chatViewActions.updateIssueState (ISSUE_STATE.ACTIVE)
                ])
              );
              chatViewActions.startPollingForMessages ();
            } else {
              dispatch (
                batchActions ([
                  chatViewActions.setActiveIssueId (null),
                  actionCreators.setInternalIssueId (null)
                ])
              );
            }
          },
          onFailure: () => {
            // @TODO: Handler failure.
          }
        });
      };
    };

    /**
     * Call the `GET issues` API to get the list of issue for the given profile.
     * The response may contain issue or pre-issue objects.
     * @param {object} config
     * @param {function} config.onSuccess
     * @param {function} config.onFailure
     */
    const getIssues = ({onSuccess, onFailure}) => {
      const {appState} = store.getState ();

      xhr ({
        route: routes.getIssues (appState.domain),
        data: xhrHelpers.getPreparedXhrData (),
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess,
        onFailure
      });
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
     * Action to close the conversation
     * @returns {Object} - Action
     */
    const closeConversation = () => {
      return (dispatch) => {
        dispatch (reset ({
          skipUser: true,
          minimizeMessenger: true
        }));

        // Fire event of chat end
        postSdkMessage.chatEndEvent ();
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
     * Action to set metadata.
     * @param {Object} metadata
     * @returns {Object} - Action
     */
    const setMetadata = (parentPageInfo) => {
      const metadata = getPreparedDeviceInfo (parentPageInfo);

      return {
        type: ACTION_TYPES.SET_METADATA,
        metadata
      };
    };

    /**
     * Action to set the parent page info
     * @param {Object} parentPageInfo
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
     * Action to set footer active
     * @returns {Object} - Action
     */
    const setFooterActive = () => {
      return {
        type: ACTION_TYPES.SET_FOOTER_ACTIVE
      };
    };

    /**
     * Action to set footer inactive
     * @returns {Object} - Action
     */
    const setFooterInactive = () => {
      return {
        type: ACTION_TYPES.SET_FOOTER_INACTIVE
      };
    };

    return {
      setDeviceId,
      setAnonUserId,
      setClientConfig,
      setWmConfig,
      initialize,
      toggleMinimized,
      reset,
      setInitialUserMsg,
      startConversation,
      closeConversation,
      replaceCif,
      setMetadata,
      setParentPageInfo,
      setProactiveChatRules,
      executeProactiveChatRules,
      updateStyles,
      setFooterActive,
      setFooterInactive
    };
  });
