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
    "constants/analytics",
    "gunpowder/utils/xhr",
    "helpers/entitySchema",
    "helpers/entity",
    "helpers/xhr",
    "helpers/analytics",
    "actions/actionCreators",
    "actions/entities"
  ],
  function (store, normalizr, ACTION_TYPES, routes, ACTIVE_VIEW, analyticsConstants,
    xhr, entitySchema, entityHelpers, xhrHelpers, analyticsHelpers, actionCreators,
    entitiesActions) {
    "use strict";

    const {normalize} = normalizr;

    const {EVENT} = analyticsConstants;

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

            // Track FAQ read (same as fetched from backend) event here.
            analyticsHelpers.track (EVENT.FAQ_READ, {
              faqId
            });

            // For issue deflection events, we need to send a list of FAQ IDs
            // in the order they were read.
            dispatch (actionCreators.updateReadFaqList (faqId));
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
