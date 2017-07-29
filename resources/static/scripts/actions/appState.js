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
    "gunpowder/utils/xhr",
    "gunpowder/utils/object",
    "actions/entities",
    "actions/chatView",
    "utils/postMessage"
  ],
  function (ACTION_TYPES, routes, EVENT_TYPES, normalizr, entitySchema,
    entityHelpers, chatViewHelpers, xhrHelpers, xhr, objUtils,
    entitiesActions, chatViewActions, postMessage) {
    "use strict";

    const {normalize} = normalizr;

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
            agent_nickname_enabled: false,
            answer_bot_enabled: false,
            user_info_bot_enabled: false,
            csat_bot_enabled: false,
            greeting_msg: "Hello! How can I help you today?",
            appearance: {
              widget_title: "Chat with us!",
              primary_color: "#00b6fc"
            },
            user_info_bot: {
              selection: ["name"]
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
      setClientConfig,
      setWmConfig,
      setUser,
      updateActiveView,
      startNewConversation,
      toggleMinimized
    };
  });
