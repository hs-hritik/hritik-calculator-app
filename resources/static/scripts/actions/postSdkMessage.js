/**
 * Actions to call postMessage API for Web Chat events
 * @author Prasenit Sharan <prasenjit@helpshift.com>
 * @created 12 Jun, 2019
 */

define("actions/postSdkMessage", [
  "utils/postMessage",
  "gunpowder/utils/url",
  "constants/eventTypes"
], function(postMessage, urlUtils, EVENT_TYPES) {
  "use strict";

  /**
   * Gets the origin of the parent page by reading the query string of the web
   * chat iframe's URL. Falls back to the origin stored in the state and "*".
   * @param {function} getState - Store method to get the state
   * @returns {string} - the origin string.
   */
  const _getParentPageOrigin = (getState) => {
    // If the parent page origin is specified with the "parent" param
    // of the iframe url, use it as the parentPageOrigin.
    const urlParams = urlUtils.getQueryParams(window.document.location);

    if (urlParams.get("parent")) {
      return urlParams.get("parent");
    }

    // Else return the parent page's origin value from the state
    return getState().appState.parentPageInfo.origin || "*";
  };

  /**
   * Post message to toggle messenger.
   * @param {boolean} minimized
   */
  const toggleMessenger = (minimized) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_TOGGLE_MESSENGER,
        data: {
          minimized
        },
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post message to indicate reset event.
   */
  const reset = () => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_RESET,
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to handle conversation start
   * This is triggered when user adds the first message.
   * @param {string} message - message body
   */
  const conversationStartEvent = (message) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_CONVERSATION_START,
        data: {
          message
        },
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
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
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_CONVERSATION_END,
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to handle conversation reopen.
   * Ie, when the resolution is rejected and user sends
   * a new message
   */
  const conversationReopenedEvent = () => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_CONVERSATION_REOPENED,
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to handle conversation being resolved from
   * the agent-side
   */
  const conversationResolvedEvent = () => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_CONVERSATION_RESOLVED,
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to handle conversation being rejected from
   * the agent-side
   */
  const conversationRejectedEvent = () => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_CONVERSATION_REJECTED,
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   *
   * This is triggered when user sends a message.
   * @param {string} type - type of message
   * @param {string} body - content of the message
   */
  const messageAddEvent = (type, body) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_MESSAGE_ADD,
        data: {
          type,
          body
        },
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * This is triggered when user submits csat review
   * @param {number} csatObj.rating - CSAT Rating [1-5]
   * @param {string} csatObj.review - CSAT Review comment
   */
  const csatSubmitEvent = (csatObj) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_CSAT_SUBMIT,
        data: csatObj,
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post message to update unread count
   * @param {number} unreadCount
   */
  const updateUnreadCount = (unreadCount) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_UPDATE_UNREAD_COUNT,
        data: {
          count: unreadCount
        },
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post message to pass wm config.
   * @param {Object} config
   */
  const wmConfig = (config) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_CONFIG_LOADED,
        data: {
          wmConfig: config
        },
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk js loaded event.
   */
  const jsLoaded = () => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_JS_LOADED,
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event for end chat
   */
  const chatEndEvent = () => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_CHAT_END,
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event for ui config update
   * @param {Object} cssConfig - css config/styles for launcher icon
   */
  const uiConfigUpdatedEvent = (cssConfig) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_UI_CONFIG_UPDATED,
        data: {
          cssConfig
        },
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to log ui config errors
   * @param {array} errors - list of ui config errors
   */
  const uiConfigErrors = (errors) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_UPDATE_UI_CONFIG_ERRORS,
        data: {
          errors
        },
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to fire user changed event
   * @param {Object} userInfo - Re-engagement user's information
   */
  const userChanged = (userInfo) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_USER_CHANGED_VIA_RE_ENGAGEMENT,
        data: {
          userInfo
        },
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to notify conversation status
   * @param {Object} data
   * @param {Boolean} data.open - whether conversation is open i.e. issue or
   *                              preIssue is active (not closed)
   */
  const conversationStatusEvent = (data) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_CONVERSATION_STATUS,
        data,
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to focus on webchat launcher btn
   */
  const focusLauncher = () => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_FOCUS_LAUNCHER,
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to communicate the added data in the local storage
   * @param {Object} data - Key value pair updated in the local storage
   */
  const setLocalStorageData = (data) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_SET_LOCAL_STORAGE_DATA,
        data,
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to communicate the removed data in the local storage
   * @param {Object} data - Key value pair updated in the local storage
   */
  const removeLocalStorageData = (data) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_REMOVE_LOCAL_STORAGE_DATA,
        data,
        parentPageOrigin: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to communicate the ui config changes
   * @param {Object} data - Payload data
   * @param {string} data.primaryColor - Webchat widget primary color
   * @param {string} data.chatWidgetBgColor - Chat widget background color
   */
  const uiConfigChange = (data) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_UI_CONFIG_CHANGE,
        data,
        parentPageInfo: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to communicate the push token sync data
   * @param {object} data - Payload data
   * @param {string} data.headers - Common headers required for firing an XHR in webchat
   * @param {string} data.requestPayload - Request payload data required for firing an
   * XHR in webchat
   */
  const pushTokenSync = (data) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_PUSH_TOKEN_SYNC,
        data,
        parentPageInfo: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to communicate the reason for user auth failure
   * @param {object} data - Payload data
   * @param {string} data.type - Auth failure status code
   * @param {string} data.message - Auth failure reason
   */
  const userAuthFailure = (data) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_USER_AUTH_FAILURE,
        data,
        parentPageInfo: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * Post sdk event to communicate the removal of anonymous user
   */
  const removeAnonymousUser = () => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_REMOVE_ANONYMOUS_USER,
        parentPageInfo: _getParentPageOrigin(getState)
      });
    };
  };

  /**
   * In case of brezel-less devices, lite sdk applies a safe
   * area (which is nothing but an empty ui component having
   * color similar to chat footer), therefore webchat needs to
   * send the active footer color.
   *
   * @param {Object} data - Event data
   * @param {String} data.safeAreaColor - Hex code color to be applied in the safe area
   */
  const sendSafeAreaColorToLiteSdk = (data) => {
    return (dispatch, getState) => {
      postMessage({
        type: EVENT_TYPES.SDK_EVENT_SAFE_AREA_COLOR,
        data,
        parentPageInfo: _getParentPageOrigin(getState)
      });
    };
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
    conversationResolvedEvent,
    conversationRejectedEvent,
    userChanged,
    messageAddEvent,
    csatSubmitEvent,
    conversationStatusEvent,
    focusLauncher,
    setLocalStorageData,
    removeLocalStorageData,
    uiConfigChange,
    pushTokenSync,
    userAuthFailure,
    removeAnonymousUser,
    sendSafeAreaColorToLiteSdk
  };
});
