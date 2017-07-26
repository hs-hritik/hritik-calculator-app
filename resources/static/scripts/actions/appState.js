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
    const setClientConfig = (config) => {
      return {
        type: ACTION_TYPES.SET_CLIENT_CONFIG,
        config
      };
    };

    /**
     * Action to set user id.
     * @param {String} id - user id.
     * @returns {Object} - action
     */
    const setUserId = (id) => {
      return {
        type: ACTION_TYPES.SET_USER_ID,
        id
      };
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
          onSuccess: () => {
            dispatch (getIssues (user));
          }
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
    const updateActiveView = (view) => {
      return {
        type: ACTION_TYPES.UPDATE_ACTIVE_VIEW,
        view
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
      setClientConfig,
      setUser,
      updateActiveView,
      startNewConversation,
      toggleMinimized
    };
  });
