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
    "normalizr",
    "helpers/entitySchema",
    "helpers/entity",
    "helpers/xhr",
    "helpers/localStorage",
    "gunpowder/utils/xhr",
    "gunpowder/utils/object",
    "gunpowder/utils/uuid",
    "store",
    "actions/entities",
    "actions/chatView",
    "actions/batch",
    "actions/actionCreators",
    "utils/postMessage",
    "utils/browser",
    "extras/postSdkMessage"
  ],
  function (ACTION_TYPES, routes, APP_STATE_CONSTANTS,
    CHAT_VIEW_CONSTANTS, normalizr, entitySchema, entityHelpers,
    xhrHelpers, lsHelpers, xhr, objUtils, uuidGenerator,
    store, entitiesActions, chatViewActions, batchActions, actionCreators,
    postMessage, browserUtils, postSdkMessage) {
    "use strict";

    const {normalize} = normalizr,
          {ISSUE_STATE} = APP_STATE_CONSTANTS,
          {ACTIVE_FOOTER} = CHAT_VIEW_CONSTANTS;

    // Constant indicating whether to skip checking a value in localstorage or not
    const SKIP_LS_CHECK = true;

    let returningUser = false;

    /**
     * Set the identifier in the state to identify the user (or the chat session).
     * The creation of a new identifier depends on the userId passed here.
     * If the current userId is different than the one stored in the
     * localstorage, we create a new identifier and update the value.
     * For details about implementation see -
     * https://helpshift.atlassian.net/wiki/display/FRON/Possible+Solution+for+Identity+Problem
     * @param {String} userId
     */
    const setIdentifier = (userId) => {
      return () => {
        const prevUserId = lsHelpers.getUserId ();
        // identifier is the uuid (Universally unique identifier)
        const identifier = uuidGenerator ();

        const lastActivityTime = lsHelpers.getLastActivityTime (),
              {resetTimeout} = store.getState ().appState;

        // If the last activity was done before reset timeout,
        // use the new identifier.
        if (lastActivityTime && (Date.now () - lastActivityTime) > resetTimeout) {
          lsHelpers.setUserId (userId);
          dispatchAndSetIdentifier (identifier, SKIP_LS_CHECK);
          return;
        }

        if (isUserIdValid (prevUserId)) {
          if (!isUserIdValid (userId)) {
            // User A -> null
            // If an identifier does not exist, set one in state and localstorage.
            dispatchAndSetIdentifier (identifier);
          } else if (userId !== prevUserId) {
            // User A -> User B
            // Set the userId in localstorage.
            // Set the identifier in state and localstorage.
            lsHelpers.setUserId (userId);
            dispatchAndSetIdentifier (identifier, SKIP_LS_CHECK);
          } else {
            // User A -> User A
            // User id - No action.
            // Set the identifier in state
            dispatchAndSetIdentifier (identifier);
          }
        } else if (isUserIdValid (userId)) {
          // null -> User A
          // Set the userId in localstorage.
          // If an identifier does not exist, set one in state and localstorage.
          lsHelpers.setUserId (userId);
          dispatchAndSetIdentifier (identifier);
        } else {
          // null -> null
          // There would be no userId in localstorage, no action.
          // If an identifier does not exist, set one in state and localstorage.
          dispatchAndSetIdentifier (identifier);
        }
      };
    };

    /**
     * Auxiliary function to dispatch and set the identifier to app state and
     * localstorage respectively if identifier isn't present in localstorage.
     * @param {String} identifier - identifier
     * @param {Boolean} skipLsCheck - True if the localStorage doesn't need
     * to be checked if identifier exists.
     */
    const dispatchAndSetIdentifier = (identifier, skipLsCheck) => {
      if (skipLsCheck || !lsHelpers.getIdentifier ()) {
        store.dispatch (setIdentifierValue (identifier));
        lsHelpers.setIdentifier (identifier);
        // If we are saving a new identifier, that means it's a new user.
        returningUser = false;
      } else {
        // If a new identifier is not set in the state and ls, set the identifier
        // stored in the localstorage to the sate because the initial state
        // does not have an identifier.
        const currentIdentifier = lsHelpers.getIdentifier ();
        store.dispatch (setIdentifierValue (currentIdentifier));
        // If we are using the already saved identifier,
        // that means it's a returning user.
        returningUser = true;
      }
    };

    /**
     * Either starts a new conversation or handle previous one.
     */
    const startConversation = () => {
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
     * - Minimize messenger if options.minimizeMessenger is true.
     * @param {Object} [options]
     * @param {Boolean} [options.skipUser] - Whether to skip resetting for user related data.
     *                                       By default, user related data will be reset.
     * @param {Boolean} [options.minimizeMessenger] - Whether to minimize the messenger or not.
     *                                                Defaults to false.
     */
    const reset = (options = {}) => {
      return (dispatch, getState) => {
        chatViewActions.stopPollingForMessages ();
        dispatch (actionCreators.reset ());
        postSdkMessage.reset ();
        lsHelpers.reset ({
          skipUser: options.skipUser
        });

        const {minimized} = getState ().appState;
        if (options.minimizeMessenger && !minimized) {
          postSdkMessage.toggleMessenger (true);
        }
      };
    };

    /**
     * Handle ongoing conversation.
     */
    const handleOngoingConversation = () => {
      const issueState = lsHelpers.getIssueState ();
      switch (issueState) {
        case ISSUE_STATE.PRE_CHAT:
          rehydrate ();
          store.dispatch (chatViewActions.startPreChatFeature ());
          break;

        case ISSUE_STATE.ACTIVE:
          const activeIssueId = lsHelpers.getActiveIssueId ();
          // If there is an active issue id in localstorage, set the activeIssueId in state,
          // and start polling for new messages.
          if (activeIssueId) {
            rehydrate ();
            store.dispatch (chatViewActions.setActiveIssue (activeIssueId));
            chatViewActions.startPollingForMessages ();
          } else {
            // Ideally, this shouldn't be the case because we are first setting the
            // active issue id, and then we are changing the issue state to active.
            // But to be on safer side, start new conversation if there is no active issue id.
            store.dispatch (startNewConversation ());
          }
          break;

        case ISSUE_STATE.RESOLVED:
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
            endUserFirstMsgId = lsHelpers.getEndUserFirstMsgId ();

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
            infoBotCurrentField,
            issueState,
            replyText,
            userProfileId,
            endUserFirstMsgId
          }
        });
      }
    };

    /**
     * Return true if the passed user id valid.
     * @param {String} userId
     * @returns {Boolean}
     */
    const isUserIdValid = (userId) => typeof userId === "string" && userId !== "";

    /**
     * Returns tags array containing string values converted to lowercase
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
        }).map ((tag) => {
          // Convert the string values to lower case
          return tag.toLowerCase ();
        });
      }

      return validTags;
    };

    /**
     * Action to set identifier.
     * @param {String} id - identifier
     * @returns {Object} - action
     */
    const setIdentifierValue = (id) => ({
      type: ACTION_TYPES.SET_IDENTIFIER,
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

      return {
        type: ACTION_TYPES.SET_CLIENT_CONFIG,
        config
      };
    };

    /**
     * Action to set the web messenger configuration set by the Helpshift admin
     * and set it to the store. Post message to the client with the config.
     * This configuration contains settings like if wm is enabled, appearance,
     * answer bot, etc.
     */
    const setWmConfig = () => {
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

            const primaryColor = store.getState ().ui.color.primary;
            const cssConfig = {
              primaryColor,
              primaryColorLight: shadeColor (primaryColor, 0.20),
              primaryColorDark: shadeColor (primaryColor, -0.20)
            };

            // Send the config event loaded back to the client
            postSdkMessage.wmConfig (getClientWmConfig (cssConfig));

            if (response.wm_widget_enabled) {
              // A side-effect of getting the web messenger config would be to
              // add the stylesheet with the primary color (and any other
              // configurable CSS value) to the document head.
              setStyles (cssConfig);
              startConversation ();
            }
          }
        });
      };
    };

    /**
     * Get web messenger config via the HS API.
     * @param {String} domain
     * @param {String} platformId
     * @param {Object} callbacks - callbacks passed by the caller e.g. onSuccess
     */
    const getWmConfig = (domain, platformId, callbacks) => {
      xhr ({
        route: routes.getWmConfig (domain, platformId),
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
          if (callbacks.onSuccess) {
            callbacks.onSuccess (response);
          }
        },
        onFailure: () => {
          // @TODO: Handle failure.
        }
      });
    };

    /**
     * Return client relevant web messenger config object
     * @param {Object} response - the GET wm config response object
     * @returns {Object} - the config object for client
     */
    const getClientWmConfig = (cssConfig) => {
      const {appState} = store.getState ();

      return {
        widgetEnabled: appState.wmEnabled,
        browserIsMobile: appState.browserIsMobile,
        cssConfig
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
    const setStyles = (cssConfig) => {
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

          let isCssVarSupported = false;
          if (window.CSS && window.CSS.supports && window.CSS.supports ("--fake-var", 0)) {
            isCssVarSupported = true;
          }

          if (isCssVarSupported) {
            _addStyleToDocument (css);
            _updateCssVars (cssConfig);
          } else {
            const updatedCss = _getCssVarsUpdatedCss (css, cssConfig);
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
     * Create a style tag and add it to document's head.
     * @param {String} - css, a string with the CSS styles
     */
    // @TODO: Check if we should move this to a utility module, or a helper.
    const _addStyleToDocument = (css) => {
      const head = document.head,
            style = document.createElement ("style");

      style.type = "text/css";
      style.appendChild (document.createTextNode (css));

      head.appendChild (style);
    };

    /**
     * Lighten or darken the given color.
     * Usage example:
     *  - To lighten a color by 10%
     *    shadeColor ("#123456", 0.1)
     *  - To darken a color by 10%
     *    shadeColor ("#123456", -0.1)
     * Taken from: https://stackoverflow.com/a/13542669/3785351
     * @param {String} color - The string of the color which has to be lighten or darken.
     *                         Only hex is supported. (# must be passed in the beginning.)
     * @param {Number} shadeFactor - Between -1 to 1. To darken the color, give negative value.
     *                               To lighten the color, give positive value.
     */
    const shadeColor = (color, shadeFactor) => {
      // Remove #
      color = color.slice (1);
      // If color length is 3, change it to 6
      if (color.length === 3) {
        color = color [0] + color [0] + color [1] + color [1] + color [2] + color [2];
      }

      const f = parseInt (color, 16),
            t = shadeFactor < 0 ? 0 : 255,
            p = shadeFactor < 0 ? shadeFactor * -1 : shadeFactor,
            R = f >> 16,
            G = f >> 8 & 0x00FF,
            B = f & 0x0000FF;

      return "#" +
        (0x1000000 + (Math.round ((t - R) * p) + R) *
         0x10000 + (Math.round ((t - G) * p) + G) *
         0x100 + (Math.round ((t - B) * p) + B)
        ).toString (16).slice (1);
    };

    /**
     * Update CSS variables with the configured values and set the values in
     * the document's css.
     * @param {Object} - cssConfig, the object with css configured values
     */
    const _updateCssVars = (cssConfig) => {
      document.body.style.setProperty (
        "--hs-custom-primary-color", cssConfig.primaryColor
      );
      document.body.style.setProperty (
        "--hs-custom-primary-color-dark", cssConfig.primaryColorDark
      );
      document.body.style.setProperty (
        "--hs-custom-primary-color-light", cssConfig.primaryColorLight
      );
    };

    /**
     * Update and return the css string with variables
     * replaced by the configured values
     * @param {String} - css, the css string
     * @param {Object} - cssConfig, the object with css configured values
     */
    const _getCssVarsUpdatedCss = (css, cssConfig) => {
      // Because we need to replace variable strings containing special chars
      // like "(" and ")", we need to escape these chars when creating the
      // regular expression. A list with all regexp strings params for the vars.
      const cssVarsRegexpList = [
        "var\\(--hs-custom-primary-color\\)",
        "var\\(--hs-custom-primary-color-light\\)",
        "var\\(--hs-custom-primary-color-dark\\)"
      ];

      // When regular expression matches, we need to replace the matches
      // with the configured values. Mapping all such matches with the values to
      // be replaced.
      const cssVarsValuesMap = {
        "var(--hs-custom-primary-color)": cssConfig.primaryColor,
        "var(--hs-custom-primary-color-light)": cssConfig.primaryColorLight,
        "var(--hs-custom-primary-color-dark)": cssConfig.primaryColorDark
      };

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
     * @returns {String|null} - active issue id or null
     */
    const _getActiveIssueId = (issues) => {
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
     * Creates dummy issue entity.
     * The initial conversation on the web sdk would not be part of an
     * issue created on the server. So, we need to create a dummy issue
     * on frontend and add messages to it.
     * @returns {Function} - action.
     */
    const startNewConversation = () => {
      return (dispatch, getState) => {
        lsHelpers.reset ({
          skipUser: true
        });
        const state = getState ();
        // Create dummy issue entity.
        dispatch (
          batchActions ([
            entitiesActions.setEntities ({
              issues: {
                [state.appState.dummyIssueId]: {
                  messages: []
                }
              }
            }),
            chatViewActions.setActiveIssue (null),
            chatViewActions.updateIssueState (ISSUE_STATE.PRE_CHAT),
            chatViewActions.setChatViewFooter (ACTIVE_FOOTER.BLOCKED)
          ])
        );
        dispatch (chatViewActions.startPreChatFeature ());
      };
    };

    /**
     * Action to get user issues.
     * @param {Object} user - user object. Contains id, name and email.
     * @returns {Object} - action
     */
    // @TODO: Remove the getIssues function if not required.
    // Temporarily disabling no-unused-vars to avoid eslint error.
    /* eslint-disable no-unused-vars */
    const getIssues = (identifier) => {
    /* eslint-enable no-unused-vars */
      return (dispatch, getState) => {
        const state = getState ();
        const appState = state.appState;
        xhr ({
          route: routes.getMyIssues (appState.domain),
          data: {
            "identifier": identifier,
            "platform-id": appState.platformId
          },
          headers: xhrHelpers.getCommonHeaders (),
          onSuccess: (response) => {
            const normalizedData = normalize (response, entitySchema.issues);
            const processedEntities = entityHelpers.getProcessedEntities (normalizedData.entities);

            dispatch (entitiesActions.setEntities (processedEntities));

            const activeIssueId = _getActiveIssueId (processedEntities.issues);

            if (activeIssueId) {
              // Active issue workflow
              dispatch (chatViewActions.setActiveIssue (activeIssueId));
              chatViewActions.startPollingForMessages ();
            } else {
              dispatch (startNewConversation ());
            }
          },
          onFailure: () => {
            // @TODO: Handler failure.
          }
        });
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

    return {
      setIdentifier,
      setClientConfig,
      setWmConfig,
      toggleMinimized,
      reset
    };
  });
