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
    "helpers/message",
    "helpers/xhr",
    "helpers/analytics",
    "actions/actionCreators",
    "actions/batch"
  ],
  function (store, ACTION_TYPES, routes, ACTIVE_VIEW, analyticsConstants,
    xhr, messageHelpers, xhrHelpers, analyticsHelpers, actionCreators,
    batchActions) {
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
     * Action to toggle FAQ loading.
     * @param {Boolean} loading
     * @returns {Object} - Action
     */
    const toggleFaqLoading = (loading) => {
      return {
        type: ACTION_TYPES.TOGGLE_FAQ_LOADING,
        loading
      };
    };

    /**
     * Action to set FAQ error message.
     * @param {Boolean} errorMsg
     * @returns {Object} - Action
     */
    const setFaqErrorMsg = (errorMsg) => {
      return {
        type: ACTION_TYPES.SET_FAQ_ERROR_MESSAGE,
        errorMsg
      };
    };

    /**
     * Action to get FAQ details for a given faq-id.
     * @param {string} faqId - FAQ id
     * @param {string} language - The language the FAQ body should render in
     * @returns {Object} - action
     */
    const getFaq = (faqId, language) => {
      return (dispatch, getState) => {
        const state = getState ();
        const {
          appState: {
            domain,
            analytics: {
              suggestedFaqReadTracked
            }
          },
          ui: {
            text: {
              networkError
            }
          }
        } = state;

        dispatch (
          batchActions ([
            toggleFaqLoading (true),
            setFaqErrorMsg (""),
            actionCreators.updateActiveView (ACTIVE_VIEW.FAQ)
          ])
        );

        xhr ({
          route: routes.getFaq (domain, faqId),
          headers: xhrHelpers.getCommonHeaders (),
          data: {
            nonce: Date.now ()
          },
          onSuccess: (response) => {
            const faq = messageHelpers.getProcessedFaq (response, language);
            dispatch (setActiveFaq (faq));

            // Track suggested FAQ read event if it hasn't been tracked already.
            if (!suggestedFaqReadTracked) {
              analyticsHelpers.track (EVENT.SUGGESTED_FAQ_READ, {
                faqId
              });
            }

            // For issue deflection events, we need to send a list of FAQ IDs
            // in the order they were read.
            dispatch (actionCreators.updateReadFaqList (faqId));
          },
          onFailure: () => {
            // @TODO: Handle failure.
            dispatch (setFaqErrorMsg (networkError));
          },
          onEnd: () => {
            dispatch (toggleFaqLoading (false));
          }
        });
      };
    };

    return {
      getFaq
    };
  });
