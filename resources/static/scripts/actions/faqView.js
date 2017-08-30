/**
 * Actions for the FAQ view
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created June 14, 2017
 */

define ("actions/faqView",
  [
    "store",
    "normalizr",
    "constants/actionTypes",
    "constants/routes",
    "constants/activeView",
    "gunpowder/utils/xhr",
    "helpers/entitySchema",
    "helpers/entity",
    "helpers/xhr",
    "actions/actionCreators",
    "actions/entities"
  ],
  function (store, normalizr, ACTION_TYPES, routes, ACTIVE_VIEW, xhr, entitySchema,
    entityHelpers, xhrHelpers, actionCreators, entitiesActions) {
    "use strict";

    const {normalize} = normalizr;

    /**
     * Action to set the active FAQ id in the FAQ View store
     * @param {String} faqId
     * @returns {Object} - the action object
     */
    const setActiveFaqId = (faqId) => {
      return {
        type: ACTION_TYPES.SET_ACTIVE_FAQ_ID,
        faqId
      };
    };

    /**
     * Action to get FAQ details for a given faq-id.
     * @param {String} faqId - FAQ id
     * @returns {Object} - action
     */
    const getFaq = (faqId) => {
      return (dispatch, getState) => {
        const state = getState ();
        const appState = state.appState;

        xhr ({
          route: routes.getFaq (appState.domain, faqId),
          headers: xhrHelpers.getCommonHeaders (),
          onSuccess: (response) => {
            const normalizedData = normalize (response, entitySchema.faq);
            const processedEntities = entityHelpers.getProcessedEntities (
              normalizedData.entities
            );

            dispatch (entitiesActions.setEntities (processedEntities));
            dispatch (setActiveFaqId (faqId));
            dispatch (actionCreators.updateActiveView (ACTIVE_VIEW.FAQ));
          },
          onFailure: () => {
            // @TODO: Handle failure.
          }
        });
      };
    };

    return {
      getFaq
    };
  });
