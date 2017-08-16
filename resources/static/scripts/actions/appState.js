/**
 * App state related actions.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 7, 2017
 */

define ("actions/appState",
  [
    "constants/actionTypes",
    "constants/routes",
    "constants/eventTypes",
    "constants/appState",
    "constants/chatView",
    "normalizr",
    "helpers/entitySchema",
    "helpers/entity",
    "helpers/chatView",
    "helpers/xhr",
    "helpers/localStorage",
    "gunpowder/utils/xhr",
    "gunpowder/utils/object",
    "gunpowder/utils/uuid",
    "gunpowder/utils/throttle",
    "store",
    "actions/entities",
    "actions/chatView",
    "actions/batch",
    "utils/postMessage",
    "extras/postSdkMessage",
    "components/app"
  ],
  function (ACTION_TYPES, routes, EVENT_TYPES, APP_STATE_CONSTANTS,
    CHAT_VIEW_CONSTANTS, normalizr, entitySchema, entityHelpers,
    chatViewHelpers, xhrHelpers, lsHelper, xhr, objUtils, uuidGenerator,
    throttle, store, entitiesActions, chatViewActions, batchActions,
    postMessage, postSdkMessage, app) {
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
        const prevUserId = lsHelper.getUserId ();
        // identifier is the uuid (Universally unique identifier)
        const identifier = uuidGenerator ();

        if (isUserIdValid (prevUserId)) {
          if (!isUserIdValid (userId)) {
            // User A -> null
            // If an identifier does not exist, set one in state and localstorage.
            dispatchAndSetIdentifier (identifier);
          } else if (userId !== prevUserId) {
            // User A -> User B
            // Set the userId in localstorage.
            // Set the identifier in state and localstorage.
            lsHelper.setUserId (userId);
            dispatchAndSetIdentifier (identifier, SKIP_LS_CHECK);
            // @TODO Clear the conversation.
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
          lsHelper.setUserId (userId);
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
      if (skipLsCheck || !lsHelper.getIdentifier ()) {
        store.dispatch (setIdentifierValue (identifier));
        lsHelper.setIdentifier (identifier);
        // If we are saving a new identifier, that means it's a new user.
        returningUser = false;
      } else {
        // If a new identifier is not set in the state and ls, set the identifier
        // stored in the localstorage to the sate because the initial state
        // does not have an identifier.
        const currentIdentifier = lsHelper.getIdentifier ();
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
      const lastActivityTime = lsHelper.getLastActivityTime (),
            {resetTimeout} = store.getState ().appState;

      if ((lastActivityTime && (Date.now () - lastActivityTime) > resetTimeout) ||
           !returningUser) {
        // If the last activity was done before reset timeout,
        // or if it's a new user, start a new conversation.
        store.dispatch (startNewConversation ());
      } else {
        // If it's a returning user, that means there could be an
        // ongoing conversation.
        handleOngoingConversation ();
      }
    };

    /**
     * Action to reset the conversation.
     * It does the following tasks:
     * - Stop polling for agent messages.
     * - Dispatch action to reset the store.
     * - Post reset message to parent.
     * - Clear localstorage.
     * - Unmount the application.
     */
    const reset = () => {
      return (dispatch) => {
        chatViewActions.stopPollingForMessages ();
        dispatch ({
          type: ACTION_TYPES.RESET
        });
        postSdkMessage.reset ();
        // @TODO: Update lsHelper to reset user related data also.
        lsHelper.reset ();
        app.unmount ();
      };
    };

    /**
     * Handle ongoing conversation.
     */
    const handleOngoingConversation = () => {
      const issueState = lsHelper.getIssueState ();
      switch (issueState) {
        case ISSUE_STATE.PRE_CHAT:
          rehydrate ();
          store.dispatch (chatViewActions.startPreChatFeature ());
          break;

        case ISSUE_STATE.ACTIVE:
          const activeIssueId = lsHelper.getActiveIssueId ();
          // If there is an active issue id in localstorage, set the activeIssueId in state,
          // and start polling for new messages.
          if (activeIssueId) {
            rehydrate ();
            store.dispatch (chatViewActions.setActiveIssue (activeIssueId));
            chatViewActions.startPollingForMessages ();
          } else {
            // @TODO: Ideally, this shouldn't be the case.
            // Explore if there can be some edge case which would lead to this condition,
            // and handle accordingly.
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
      const issues = lsHelper.getEntities ("ISSUES"),
            messages = lsHelper.getEntities ("MESSAGES"),
            // @TODO: Do optimization
            // - Get pre-chat related data only if issue state is pre-chat
            preChatFeatureIndex = lsHelper.getPreChatFeatureIndex (),
            preChatFeatureState = lsHelper.getPreChatFeatureState (),
            infoBotCurrentField = lsHelper.getInfoBotCurrentField (),
            issueState = lsHelper.getIssueState (),
            replyText = lsHelper.getReplyText ();

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
            replyText
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
    const setClientConfig = (config) => ({
      type: ACTION_TYPES.SET_CLIENT_CONFIG,
      config
    });

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
            // Set the config values to the store
            dispatch (setWmConfigValues (response));

            // Send the config event loaded back to the client
            postMessage (EVENT_TYPES.SDK_CONFIG_LOADED, {
              wmConfig: getClientWmConfig (response)
            });

            if (response.widget_enabled) {
              // A side-effect of getting the web messenger config would be to
              // add the stylesheet with the primary color (and any other
              // configurable CSS value) to the document head.
              setStyles ();
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
        route: routes.getWmConfig (domain),
        data: {
          "platform-id": platformId
        },
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
          if (callbacks.onSuccess) {
            callbacks.onSuccess (response);
          }
        },
        onFailure: () => {
          // @TODO: Because this XHR is not ready yet, the failure
          // callback would be executed. Calling the onSuccess callback with a
          // dummy response here in order to test the flow.
          // This is temporary and will be removed.
          const response = {
            widget_enabled: true,
            agent_nickname_enabled: true,
            answer_bot_enabled: true,
            info_bot_enabled: true,
            csat_bot_enabled: true,
            greeting_msg: "Hello! How can I help you today?",
            appearance: {
              widget_title: "Chat with us!",
              primary_color: "#00b6fc"
            },
            info_bot: {
              selection: ["name", "email"]
            },
            csat_bot: {
              req_msg: "Thank you! Would you like to fill this?",
              form_msg: "Your feedback helps us improve"
            }
          };
          if (callbacks.onSuccess) {
            callbacks.onSuccess (response);
          }
        }
      });
    };

    /**
     * Return client relevant web messenger config object
     * @param {Object} response - the GET wm config response object
     * @returns {Object} - the config object for client
     */
    const getClientWmConfig = (response) => {
      return {
        widgetEnabled: response.widget_enabled,
        primaryColor: response.appearance.primary_color
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
          // @TODO: Use a utility function to determine the support.
          const isCssVarSupported = true;

          const {ui} = store.getState ();
          const cssConfig = {
            primaryColor: ui.color.primary
          };

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
     * Update CSS variables with the configured values and set the values in
     * the document's css.
     * @param {Object} - cssConfig, the object with css configured values
     */
    const _updateCssVars = (cssConfig) => {
      document.body.style.setProperty (
        "--hs-custom-primary-color", cssConfig.primaryColor
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
      const cssVarsRegexpList = ["var\\(--hs-custom-primary-color\\)"];

      // When regular expression matches, we need to replace the matches
      // with the configured values. Mapping all such matches with the values to
      // be replaced.
      const cssVarsValuesMap = {
        "var(--hs-custom-primary-color)": cssConfig.primaryColor
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
        lsHelper.reset ();
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
            postMessage (EVENT_TYPES.SDK_ISSUES_LOADED, {
              hasActiveIssue: !!activeIssueId
            });
          },
          onFailure: () => {
            // @TODO: Handler failure.
            // @TODO: Remove it. Temporary dispatching action to start new conversation
            // on failure until the code to save conversation in localstorage is done.
            // This xhr can fail because the identifier is not yet registerd.
            dispatch (startNewConversation ());
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
