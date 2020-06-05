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

/**
 * Action to dispatch before a user reply submit call is fired.
 *
 * @param {Object} payload
 * @param {string} payload.issueType
 * @param {boolean} payload.botStepInProgress
 * @param {string} payload.reEngagementId
 * @returns {Object} - Action
 */
const userReplyRequest = ({issueType, botStepInProgress, reEngagementId}) => {
  return {
    type: ACTION_TYPES.USER_REPLY_REQUEST,
    issueType,
    botStepInProgress,
    reEngagementId
  };
};

/**
 * Action to dispatch before a user reply submit call is fired.
 *
 * @param {string} issueType
 * @param {boolean} botStepInProgress
 * @param {array} messages - List of messages to be added to the message list
 * @param {string} messageType - Type of the user reply message, e.g. "Text"
 * @returns {Object} - Action
 */
const userReplySuccess = ({issueType, botStepInProgress, messages, messageType}) => {
  return {
    type: ACTION_TYPES.USER_REPLY_SUCCESS,
    issueType,
    botStepInProgress,
    messages,
    messageType
  };
};

/**
 * Action to dispatch before a user reply submit call is fired.
 *
 * @returns {Object} - Action
 */
const userReplyFailure = () => {
  return {
    type: ACTION_TYPES.USER_REPLY_FAILURE
  };
};

/**
 * Action to dispatch when the latest message is a "bot start" message
 *
 * @returns {Object} - Action
 */
const botStart = () => {
  return {
    type: ACTION_TYPES.BOT_START
  };
};

/**
 * Action to dispatch when the latest message is a "bot end" message
 *
 * @param {boolean} nextMessageIsBotStep - A boolean to indicate if the next message is going to be
 *    a bot message
 * @returns {Object} - Action
 */
const botEnd = ({nextMessageIsBotStep}) => {
  return {
    type: ACTION_TYPES.BOT_END,
    nextMessageIsBotStep
  };
};

export {
  createPreissueRequest,
  createPreissueSuccess,
  createPreissueFailure,
  clearErrors,
  userReplyRequest,
  userReplySuccess,
  userReplyFailure,
  botStart,
  botEnd
};
