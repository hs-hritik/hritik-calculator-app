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
    "actions/batch",
    "constants/actionTypes",
    "constants/routes",
    "constants/activeView",
    "constants/analytics",
    "gunpowder/utils/xhr",
    "helpers/xhr",
    "helpers/analytics",
    "extras/postSdkMessage"
  ],
  function (store, actionCreator, chatViewActions, batchActions, ACTION_TYPES,
    routes, ACTIVE_VIEW, analyticsConstants, xhr, xhrHelpers, analyticsHelpers,
    postSdkMessage) {
    "use strict";

    const {EVENT} = analyticsConstants;

    /**
     * Action to set csat save in progress
     * @param {Boolean} progress
     * @returns {Object} - Action
     */
    const setCsatSaveInProgress = (progress) => {
      return {
        type: ACTION_TYPES.SET_CSAT_SAVE_IN_PROGRESS,
        progress
      };
    };

    /**
     * Action to submit csat rating and review.
     * @returns {Function} - action
     */
    const submitCsat = (skipReviewComments = false) => {
      return (dispatch, getState) => {
        const {
          appState: {
            domain,
            activeIssueId
          },
          csatView: {
            rating,
            review
          }
        } = getState ();

        if (!rating) {
          return;
        }

        const xhrData = {
          rating
        };

        const csatReview = review.trim ();
        if (csatReview && !skipReviewComments) {
          xhrData.comment = csatReview;
        }

        dispatch (setCsatSaveInProgress (true));

        xhr ({
          route: routes.postCSAT (domain, activeIssueId),
          data: xhrHelpers.getPreparedXhrData (xhrData),
          headers: xhrHelpers.getCommonHeaders (),
          method: "POST",
          onSuccess: () => {
            postSdkMessage.csatSubmitEvent ({
              rating,
              review: csatReview
            });
          },
          onEnd: () => {
            dispatch (
              batchActions ([
                actionCreator.updateActiveView (ACTIVE_VIEW.CHAT),
                actionCreator.setCsatCompleted (),
                setCsatSaveInProgress (false)
              ])
            );
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
