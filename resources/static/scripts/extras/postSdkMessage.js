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
   * Post message for getting page information
   */
  const getParentInfo = () => {
    postMessage (EVENT_TYPES.SDK_GET_PARENT_INFO);
  };

  /**
   * Post message to indicate reset event.
   */
  const reset = () => {
    postMessage (EVENT_TYPES.SDK_RESET);
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

  return {
    toggleMessenger,
    getParentInfo,
    reset,
    updateUnreadCount,
    wmConfig,
    jsLoaded,
    chatEndEvent,
    uiConfigUpdatedEvent
  };
});
