/**
 * Common action creators.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 16, 2017
 */

define ("actions/actionCreators",
["constants/actionTypes"],
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

  return {
    updateActiveView
  };
});
