/**
 * App state related actions.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 7, 2017
 */

define ("actions/appStateActions",
  [
    "constants/actionTypes",
    "constants/routes",
    "normalizr",
    "helpers/entitySchema",
    "gunpowder/utils/xhr",
    "actions/entitiesActions"
  ],
  function (ACTION_TYPES, routes, normalizr, entitySchema, xhr, entitiesActions) {
    "use strict";

    const {normalize} = normalizr;

    /**
     * Action to set config.
     */
    const setConfig = function (config) {
      return {
        type: ACTION_TYPES.SET_CONFIG,
        config
      };
    };

    /**
     * Action to set user id.
     */
    const setUserId = function (id) {
      return {
        type: ACTION_TYPES.SET_USER_ID,
        id
      };
    };

    /**
     * Action to fetch the user issues and normalize the data.
     */
    const setUser = function (id) {
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

            // @TODO: Explore helpers to dispatch multiple actions once.
            // Use them if they are useful.
            dispatch (setUserId (id));
            dispatch (entitiesActions.setEntities (normalizedData.entities));
          },
          onFailure: () => {
            // @TODO: Handler failure.
          }
        });
      };
    };

    return {
      setConfig,
      setUser
    };
  });
