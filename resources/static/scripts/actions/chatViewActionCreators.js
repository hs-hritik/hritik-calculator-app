/**
 * Action creators for chat view actions.
 * @author Prasenjit Sharan <ps@helpshift.com>
 * @created 12 May, 2020
 */

import ACTION_TYPES from "constants/actionTypes";

/**
 * Action to dispatch before a create preissue call is fired.
 *
 * @returns {Object} - Action
 */
const createPreissueRequest = () => {
  return {
    type: ACTION_TYPES.CREATE_PREISSUE_REQUEST
  };
};

/**
 * Return the action to be dispatched when an issue/preissue is created.
 *
 * @param {Object} issueDetails
 * @param {String} issueDetails.activeIssueId
 * @param {String} issueDetails.internalIssueId
 * @param {String} issueDetails.issueType
 * @returns {Object} - Action
 */
const createPreissueSuccess = (issueDetails) => {
  return {
    type: ACTION_TYPES.CREATE_PREISSUE_SUCCESS,
    issueDetails
  };
};

/**
 * Action to dispatch when create preissue request fails
 *
 * @param {Object} payload
 * @param {Object} payload.error
 * @param {string} error.type - Error type - For example, pre issue failure
 * @param {string} error.title
 * @param {string} [error.subtitle]
 * @param {string} [error.cta] - Call to action text
 * @returns {Object} - Action
 */
const createPreissueFailure = ({error}) => {
  return {
    type: ACTION_TYPES.CREATE_PREISSUE_FAILURE,
    error
  };
};

/**
 * Action to dispatch when fetch messages API calls (updates and history) succeed and errors have to
 * be cleared.
 * @returns {Object} - Action
 */
const clearErrors = () => {
  return {
    type: ACTION_TYPES.CLEAR_CHAT_VIEW_ERRORS
  };
};

export {createPreissueRequest, createPreissueSuccess, createPreissueFailure, clearErrors};
