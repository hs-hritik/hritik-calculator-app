/**
 * Post sdk messages which would be listened by the parent.
 * @author Manish Garg <manish@helpshift.com>
 * @created August 14, 2017
 */

define ("extras/postSdkMessage",
  [
    "constants/eventTypes",
    "utils/postMessage"
  ],
function (EVENT_TYPES, postMessage) {
  "use strict";

  /**
   * Post message to toggle messenger.
   * @param {Boolean} minimized
   */
  const toggleMessenger = (minimized) => {
    postMessage (EVENT_TYPES.SDK_TOGGLE_MESSENGER, {
      minimized
    });
  };

  /**
   * Post message to indicate reset event.
   */
  const reset = () => {
    postMessage (EVENT_TYPES.SDK_RESET);
  };

  /**
   * Post sdk even to handle conversation start
   * This is triggered when user adds the first message.
   * @param {string} message - message body
   */
  const conversationStartEvent = (message) => {
    postMessage (EVENT_TYPES.SDK_EVENT_CONVERSATION_START, {
      message
    });
  };

  /**
   * Post sdk event to handle conversation end
   * Triggered when
   *    a) If there's no resolution question,
   *       when Issue is resolved/rejected.
   *    b) If there's a resolution question,
   *       when resolution is accepted.
   */
  const conversationEndEvent = () => {
    postMessage (EVENT_TYPES.SDK_EVENT_CONVERSATION_END);
  };

  /**
   * Post sdk event to handle conversation reopen.
   * Ie, when the resolution is rejected and user sends
   * a new message
   */
  const conversationReopenedEvent = () => {
    postMessage (EVENT_TYPES.SDK_EVENT_CONVERSATION_REOPENED);
  };

  /**
   *
   * This is triggered when user sends a message.
   * @param {string} type - type of message
   * @param {string} body - content of the message
   */
  const messageAddEvent = (type, body) => {
    postMessage (EVENT_TYPES.SDK_EVENT_MESSAGE_ADD, {
      type,
      body
    });
  };


  /**
   * This is triggered when user submits csat review
   * @param {Number} csatObj.rating - CSAT Rating [1-5]
   * @param {String} csatObj.review - CSAT Review comment
   */
  const csatSubmitEvent = (csatObj) => {
    postMessage (EVENT_TYPES.SDK_EVENT_CSAT_SUBMIT, csatObj);
  };


  /**
   * Post message to update unread count
   * @param {Number} unreadCount
   */
  const updateUnreadCount = (unreadCount) => {
    postMessage (EVENT_TYPES.SDK_UPDATE_UNREAD_COUNT, {
      count: unreadCount
    });
  };

  /**
   * Post message to pass wm config.
   * @param {Object} config
   */
  const wmConfig = (config) => {
    postMessage (EVENT_TYPES.SDK_CONFIG_LOADED, {
      wmConfig: config
    });
  };

  /**
   * Post sdk js loaded event.
   */
  const jsLoaded = () => {
    postMessage (EVENT_TYPES.SDK_JS_LOADED);
  };

  /**
   * Post sdk event for end chat
   */
  const chatEndEvent = () => {
    postMessage (EVENT_TYPES.SDK_EVENT_CHAT_END);
  };

  /**
   * Post sdk event for ui config update
   * @param {Object} cssConfig - css config/styles for launcher icon
   */
  const uiConfigUpdatedEvent = (cssConfig) => {
    postMessage (EVENT_TYPES.SDK_UI_CONFIG_UPDATED, {
      cssConfig
    });
  };

  /**
   * Post sdk event to log ui config errors
   * @param {Array} errors - list of ui config errors
   */
  const uiConfigErrors = (errors) => {
    postMessage (EVENT_TYPES.SDK_UPDATE_UI_CONFIG_ERRORS, {
      errors
    });
  };

  /**
   * Post sdk event to fire user changed event
   * @param {Object} userInfo - Re-engagement user's information
   */
  const userChanged = (userInfo) => {
    postMessage (EVENT_TYPES.SDK_USER_CHANGED_VIA_RE_ENGAGEMENT, {
      userInfo
    });
  };

  return {
    toggleMessenger,
    reset,
    updateUnreadCount,
    wmConfig,
    jsLoaded,
    chatEndEvent,
    uiConfigUpdatedEvent,
    uiConfigErrors,
    conversationStartEvent,
    conversationEndEvent,
    conversationReopenedEvent,
    userChanged,
    messageAddEvent,
    csatSubmitEvent
  };
});
