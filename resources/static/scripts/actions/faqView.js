/**
 * Actions for the FAQ view
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created June 14, 2017
 */

define ("actions/faqView",
  [
    "store",
    "constants/actionTypes",
    "constants/routes",
    "constants/activeView",
    "constants/analytics",
    "gunpowder/utils/xhr",
    "helpers/entitySchema",
    "helpers/entity",
    "helpers/xhr",
    "helpers/analytics",
    "actions/actionCreators"
  ],
  function (store, ACTION_TYPES, routes, ACTIVE_VIEW, analyticsConstants,
    xhr, entitySchema, entityHelpers, xhrHelpers, analyticsHelpers, actionCreators) {
    "use strict";

    const {EVENT} = analyticsConstants;

    /**
     * Action to set the active FAQ in the FAQ View store
     * @param {Object} faq - faq object
     * @returns {Object} - Action
     */
    const setActiveFaq = (faq) => {
      return {
        type: ACTION_TYPES.SET_ACTIVE_FAQ,
        faq
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
        const {
          appState: {
            domain
          }
        } = state;

        xhr ({
          route: routes.getFaq (domain, faqId),
          headers: xhrHelpers.getCommonHeaders (),
          onSuccess: (response) => {
            const faq = entityHelpers.getProcessedFaq (response);

            dispatch (setActiveFaq (faq));
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
