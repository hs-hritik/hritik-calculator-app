/**
 * Actions for the CSAT view
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 14, 2017
 */

define ("actions/csatView",
  [
    "store",
    "actions/actionCreators",
    "actions/chatView",
    "constants/actionTypes",
    "constants/routes",
    "constants/activeView",
    "constants/analytics",
    "gunpowder/utils/xhr",
    "helpers/xhr",
    "helpers/analytics"
  ],
  function (store, actionCreator, chatViewActions, ACTION_TYPES,
    routes, ACTIVE_VIEW, analyticsConstants, xhr, xhrHelpers, analyticsHelpers) {
    "use strict";

    const {EVENT} = analyticsConstants;

    /**
     * Action to submit csat rating and review.
     * @returns {Function} - action
     */
    const submitCsat = (skipReviewComments = false) => {
      return (dispatch, getState) => {
        const {appState, csatView} = getState ();

        if (!csatView.rating) {
          return;
        }

        const xhrData = {
          "identifier": appState.identifier,
          "platform-id": appState.platformId,
          "rating": csatView.rating
        };

        const csatReview = csatView.review.trim ();
        if (csatReview && !skipReviewComments) {
          xhrData.comment = csatReview;
        }

        xhr ({
          route: routes.postCSAT (appState.domain, appState.activeIssueId),
          data: xhrData,
          headers: xhrHelpers.getCommonHeaders (),
          method: "POST",
          onEnd: () => {
            // a] Set active view to chat view
            dispatch (actionCreator.updateActiveView (ACTIVE_VIEW.CHAT));
            // b] Set csat step as completed
            dispatch (actionCreator.setCsatCompleted ());
            // c] Set footer to start new conversation footer
            dispatch (chatViewActions.showPostIssueResolutionFooter ());
          }
        });

        // Track CSAT submitted event here (we don't have to wait for the CSAT
        // submitted XHR).
        analyticsHelpers.track (EVENT.CSAT, {
          event: EVENT.CSAT_SURVEY_SUBMITTED
        });
      };
    };

    /**
     * Update csat rating.
     * @param {Number} rating
     * @returns {Object} - action
     */
    const updateCsatRating = (rating) => {
      // If the chat view is active, this function is called when the end user
      // clicks on the star ratings on the chat view footer. Analytics treats this
      // as the `taking survey` event. Track it here.
      const {
        appState: {
          activeView
        }
      } = store.getState ();

      if (activeView === ACTIVE_VIEW.CHAT) {
        analyticsHelpers.track (EVENT.CSAT, {
          event: EVENT.CSAT_TAKING_SURVEY
        });
      }

      return {
        type: ACTION_TYPES.UPDATE_CSAT_RATING,
        rating
      };
    };

    /**
     * Update csat review.
     * @param {String} review
     * @returns {Object} - action
     */
    const updateCsatReview = (review) => {
      return {
        type: ACTION_TYPES.UPDATE_CSAT_REVIEW,
        review
      };
    };

    return {
      submitCsat,
      updateCsatRating,
      updateCsatReview
    };
  });
