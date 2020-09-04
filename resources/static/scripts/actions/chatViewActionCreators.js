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
const createPreissueSuccess = ({
  activeIssueId,
  internalIssueId,
  issueType,
  userIdentifier,
  issueExists
}) => {
  return {
    type: ACTION_TYPES.CREATE_PREISSUE_SUCCESS,
    activeIssueId,
    internalIssueId,
    issueType,
    userIdentifier,
    issueExists
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

/**
 * Action to dispatch when the latest bot message doesn't need a user input
 *
 * @param {string} issueType - A boolean to indicate if the next message is going to be
 *    a bot message
 * @returns {Object} - Action
 */
const botMessageWithNoUserInput = ({issueType}) => {
  return {
    type: ACTION_TYPES.BOT_MESSAGE_WITH_NO_USER_INPUT,
    issueType
  };
};

/**
 * Action to dispatch when the latest bot message contains a user input
 *
 * @param {Object} userInput - The processed user input to be updated in the state
 * @returns {Object} - Action
 */
const botMessageWithUserInput = ({userInput}) => {
  return {
    type: ACTION_TYPES.BOT_MESSAGE_WITH_USER_INPUT,
    userInput
  };
};

/**
 * Action to update polling strategy
 * @param {Object} data
 * @param {boolean} data.issueExists - True, if issue exists
 * @param {String} data.issueState - State of issue
 * @param {boolean} data.widgetIsMinimized - Messenger minimized state
 * @param {boolean} data.parentPageIsVisible - False, when window is minimized or
 * focus is on another tab
 * @param {String} data.pollingStrategy - Current polling strategy
 */
const pageVisibilityChange = (data) => {
  return {
    type: ACTION_TYPES.PAGE_VISIBILITY_CHANGE,
    data
  };
};

/**
 * Action to update polling data
 * @param {Object} data
 * @param {Number} data.pollingInterval - Time interval to execute the poller call again
 * @param {String} data.pollingStrategy - Updated polling strategy
 * @returns {Object} - action
 */
const updatePollingData = (data) => {
  const {pollingStrategy, pollingInterval} = data;

  return {
    type: ACTION_TYPES.UPDATE_POLLING_DATA,
    pollingStrategy,
    pollingInterval
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
  botEnd,
  botMessageWithNoUserInput,
  botMessageWithUserInput,
  pageVisibilityChange,
  updatePollingData
};
