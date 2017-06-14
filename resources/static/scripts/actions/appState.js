/**
 * App state related actions.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 7, 2017
 */

define ("actions/appState",
  [
    "constants/actionTypes",
    "constants/routes",
    "normalizr",
    "helpers/entitySchema",
    "gunpowder/utils/xhr",
    "gunpowder/utils/object",
    "actions/entities",
    "helpers/entity"
  ],
  function (ACTION_TYPES, routes, normalizr, entitySchema, xhr, objUtils,
    entitiesActions, entityHelpers) {
    "use strict";

    const {normalize} = normalizr;

    /**
     * Action to set config.
     * @param {Object} config
     * @returns {Object} - action
     */
    const setConfig = (config) => {
      return {
        type: ACTION_TYPES.SET_CONFIG,
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
     * Action to set active issue.
     * @param {Object} issues - issues entity.
     * @returns {Object} - action
     */
    const setActiveIssue = (issues) => {
      let activeIssueId = "";

      objUtils.forEachKey (issues, (id) => {
        const issue = issues [id];
        if (_isIssueInProgress (issue.state_data.state)) {
          activeIssueId = id;
        }
      });

      return {
        type: ACTION_TYPES.SET_ACTIVE_ISSUE,
        id: activeIssueId
      };
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
     * Action to fetch the user issues and normalize the data.
     * @param {String} id - user id.
     * @returns {Function} - async action.
     */
    const setUser = (id) => {
      return (dispatch, getState) => {
        const appState = getState ().appState;
        xhr ({
          route: routes.myIssues (appState.domain),
          data: {
            "identifier": id,
            "platform-id": appState.appId
          },
          onSuccess: (response) => {
            const normalizedData = normalize (response, entitySchema.issues);
            const processedEntities = entityHelpers.getProcessedEntities (normalizedData.entities);

            // @TODO: Explore helpers to dispatch multiple actions once.
            // Use them if they are useful.
            dispatch (setUserId (id));
            dispatch (setActiveIssue (processedEntities.issues));
            dispatch (entitiesActions.setEntities (processedEntities));
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

    return {
      setConfig,
      setUser,
      updateActiveView
    };
  });
