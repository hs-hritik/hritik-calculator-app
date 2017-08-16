/**
 * Common action creators.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 16, 2017
 */

define ("actions/actionCreators",
  [
    "constants/actionTypes"
  ],
  function (ACTION_TYPES) {
    "use strict";

    /**
     * Return action to update the active view
     * @param {String} view - update the active view to
     * @returns {Object} - the action object
     */
    const updateActiveView = (view) => ({
      type: ACTION_TYPES.UPDATE_ACTIVE_VIEW,
      view
    });

    /**
     * Return action to set user profile id.
     * @param {String} profileId - user profile id
     * @returns {Object} - the action object
     */
    const setUserProfileId = (profileId) => ({
      type: ACTION_TYPES.SET_USER_PROFILE_ID,
      profileId
    });

    /**
     * Return action to toggle agent typing
     * @param {Boolean} typing
     * @returns {Object} - the action object
     */
    const toggleAgentTyping = (typing) => ({
      type: ACTION_TYPES.TOGGLE_AGENT_TYPING,
      typing
    });

    return {
      updateActiveView,
      setUserProfileId,
      toggleAgentTyping
    };
  });
