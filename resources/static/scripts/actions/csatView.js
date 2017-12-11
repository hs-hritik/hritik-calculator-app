/**
 * Actions for the CSAT view
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 14, 2017
 */

define ("actions/csatView",
  [
    "constants/actionTypes",
    "constants/routes",
    "gunpowder/utils/xhr",
    "helpers/xhr"
  ],
  function (ACTION_TYPES, routes, xhr, xhrHelpers) {
    "use strict";

    /**
     * Action to submit csat rating and review.
     * @returns {Function} - action
     */
    const submitCsat = (skipReviewComments = false) => {
      return (dipatch, getState) => {
        const {appState, csatView} = getState ();

        if (!csatView.rating) {
          return;
        }

        dipatch (markCsatCompleted ());

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
          method: "POST"
        });
      };
    };

    /**
     * Update csat rating.
     * @param {Number} rating
     * @returns {Object} - action
     */
    const updateCsatRating = (rating) => {
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

    /**
     * Mark csat completed.
     * @returns {Object} - action
     */
    const markCsatCompleted = () => {
      return {
        type: ACTION_TYPES.MARK_CSAT_COMPLETED
      };
    };

    return {
      submitCsat,
      updateCsatRating,
      updateCsatReview
    };
  });
