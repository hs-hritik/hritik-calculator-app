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
    "normalizr",
    "helpers/entitySchema",
    "helpers/entity",
    "helpers/chatView",
    "helpers/xhr",
    "helpers/localStorage",
    "gunpowder/utils/xhr",
    "gunpowder/utils/object",
    "gunpowder/utils/uuid",
    "store",
    "actions/entities",
    "actions/chatView",
    "utils/postMessage"
  ],
  function (ACTION_TYPES, routes, EVENT_TYPES, normalizr, entitySchema,
    entityHelpers, chatViewHelpers, xhrHelpers, lsHelper, xhr, objUtils,
    uuidGenerator, store, entitiesActions, chatViewActions, postMessage) {
    "use strict";

    const {normalize} = normalizr;

    // Constant indicating whether to skip checking a value in localstorage or not
    const SKIP_LS_CHECK = true;

    /**
     * Set the uuid in the state to identify the user (or the chat session).
     * The creation of a new uuid depends on the userId passed here.
     * If the current userId is different than the one stored in the
     * localstorage, we create a new uuid and update the value.
     * For details about implementation see -
     * https://helpshift.atlassian.net/wiki/display/FRON/Possible+Solution+for+Identity+Problem
     * @param {String} - userId
     */
    const setUuid = (userId) => {
      return () => {
        const prevUserId = lsHelper.getUserId ();
        const uuid = uuidGenerator ();

        if (isUserIdValid (prevUserId)) {
          if (!isUserIdValid (userId)) {
            // User A -> null
            // If a uuid does not exist, set one in state and localstorage.
            dispatchAndSetUuid (uuid);
          } else if (userId !== prevUserId) {
            // User A -> User B
            // Set the userId in localstorage.
            // Set the uuid in state and localstorage.
            lsHelper.setUserId (userId);
            dispatchAndSetUuid (uuid, SKIP_LS_CHECK);
            // @TODO Clear the conversation.
          } else {
            // User A -> User A
            // User id - No action.
            // Set the uuid in state
            dispatchAndSetUuid (uuid);
          }
        } else if (isUserIdValid (userId)) {
          // null -> User A
          // Set the userId in localstorage.
          // If a uuid does not exist, set one in state and localstorage.
          lsHelper.setUserId (userId);
          dispatchAndSetUuid (uuid);
        } else {
          // null -> null
          // There would be no userId in localstorage, no action.
          // If a uuid does not exist, set one in state and localstorage.
          dispatchAndSetUuid (uuid);
        }
      };
    };

    /**
     * Auxiliary function to dispatch and set the uuid to app state and
     * localstorage respectively if uuid isn't present in localstorage.
     * @param {String} - uuid
     * @param {Boolean} skipLsCheck - True if the localStorage doesn't need
     * to be checked if uuid exists.
     */
    const dispatchAndSetUuid = (uuid, skipLsCheck) => {
      if (skipLsCheck || !lsHelper.getUuid ()) {
        store.dispatch (setUuidValue (uuid));
        lsHelper.setUuid (uuid);
      } else {
        // If a new uuid is not set in the state and ls, set the uuid
        // stored in the localstorage to the sate because the initial state
        // does not have a uuid.
        const currentUuid = lsHelper.getUuid ();
        store.dispatch (setUuidValue (currentUuid));
      }
    };

    /**
     * Return true if the passed user id valid.
     * @param {String} - userId
     * @returns {Boolean}
     */
    const isUserIdValid = (userId) => typeof userId === "string" && userId !== "";

    /**
     * Action to set uuid.
     * @param {String} id - uuid
     * @returns {Object} - action
     */
    const setUuidValue = (id) => ({
      type: ACTION_TYPES.SET_UUID,
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

            // A side-effect of getting the web messenger config would be to
            // add the stylesheet with the primary color (and any other
            // configurable CSS value) to the document head.
            setStyles ();
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
     * @param {Object} config.
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
     * Action to set user id.
     * @param {String} id - user id.
     * @returns {Object} - action
     */
    const setUserId = (id) => ({
      type: ACTION_TYPES.SET_USER_ID,
      id
    });

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
     * Creates dummy issue entity.
     * The initial conversation on the web sdk would not be part of an
     * issue created on the server. So, we need to create a dummy issue
     * on frontend and add messages to it.
     * @returns {Function} - action.
     */
    const startNewConversation = () => {
      return (dispatch, getState) => {
        const state = getState ();
        // Create dummy issue entity.
        dispatch (entitiesActions.setEntities ({
          issues: {
            [state.appState.dummyIssueId]: {
              messages: []
            }
          }
        }));
        dispatch (chatViewActions.setActiveIssue (null));
        // @TODO: Dispatch action to set active footer to blocked.
        dispatch (chatViewActions.startNextPreChatFeature ());
      };
    };

    /**
     * Action to fetch the user issues and normalize the data.
     * @param {Object} user - user object. Contains id, name and email.
     * @returns {Function} - async action.
     */
    const setUser = (user) => {
      return (dispatch, getState) => {
        const state = getState ();
        const domain = state.appState.domain;

        registerUserProfile (user, domain, {
          onSuccess: () => dispatch (getIssues (user))
        });
      };
    };

    /**
     * Fire xhr to register user profile.
     * @param {Object} user - user object. Contains id, name and email.
     * @param {String} domain - domain name.
     * @param {Object} [callbacks] - optional callbacks
     */
    const registerUserProfile = (user, domain, callbacks = {}) => {
      const {id, name, email} = user;

      const xhrData = {
        identifier: id
      };

      if (name) {
        xhrData.name = name;
      }
      if (email) {
        xhrData.email = email;
      }

      xhr ({
        route: routes.postProfile (domain, id),
        method: "POST",
        data: xhrData,
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
          if (callbacks.onSuccess) {
            callbacks.onSuccess (response);
          }
        },
        onFailure: () => {
          // @TODO: Handler failure.
        }
      });
    };

    /**
     * Action to get user issues.
     * @param {Object} user - user object. Contains id, name and email.
     * @returns {Object} - action
     */
    const getIssues = (user) => {
      return (dispatch, getState) => {
        const state = getState ();
        const appState = state.appState;
        xhr ({
          route: routes.getMyIssues (appState.domain),
          data: {
            "identifier": user.id,
            "platform-id": appState.platformId
          },
          headers: xhrHelpers.getCommonHeaders (),
          onSuccess: (response) => {
            const normalizedData = normalize (response, entitySchema.issues);
            const processedEntities = entityHelpers.getProcessedEntities (normalizedData.entities);

            // @TODO: Explore helpers to dispatch multiple actions once.
            // Use them if they are useful.
            dispatch (setUserId (user.id));
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
          }
        });
      };
    };

    /**
     * Return action to update the active view
     * @param {String} view - update the active view to
     * @returns {Object} - the action object
     */
    const updateActiveView = (view) => ({
      type: ACTION_TYPES.UPDATE_ACTIVE_VIEW,
      view
    });

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
      setUuid,
      setClientConfig,
      setWmConfig,
      setUser,
      updateActiveView,
      startNewConversation,
      toggleMinimized
    };
  });
