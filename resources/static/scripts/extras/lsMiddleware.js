/**
 * Localstorage middleware.
 * Save the required data in the localstorage.
 * @author Manish Garg <manish@helpshift.com>
 * @created August 11, 2017
 */

define("extras/lsMiddleware", [
  "constants/actionTypes",
  "constants/message",
  "gunpowder/utils/throttle",
  "helpers/localStorage",
  "gunpowder/utils/object"
], function(ACTION_TYPES, msgConstants, throttle, lsHelpers, objUtils) {
  "use strict";

  // @TODO: Confirm what is the correct timeout for saving the
  // last activity time in localstorage.
  const LAST_ACTIVITY_THROTTLE_TIME = 20000; // 20 seconds
  const {TYPE: MESSAGE_TYPE} = msgConstants;
  const {LS_KEYS} = lsHelpers;

  const setLastActivityTime = () => {
    lsHelpers.set(LS_KEYS.LAST_ACTIVITY_TIME, Date.now());
  };

  const throttledSetLastActivityTime = throttle(setLastActivityTime, LAST_ACTIVITY_THROTTLE_TIME, {
    leading: false
  });

  /**
   * Save the required state in localStorage.
   * @param {Object} store
   * @param {Object} action
   */
  const saveStateInLs = (store, action) => {
    const state = store.getState();

    switch (action.type) {
      case ACTION_TYPES.SET_CLIENT_CONFIG:
        // This is used to keep track of userId, passed with helpsfhitConfig.
        lsHelpers.set(LS_KEYS.USER_ID, action.config.userId);
        break;

      case ACTION_TYPES.APPEND_MESSAGES:
        const hasUserMessage = action.messages.some((m) => m.isCustomerMsg);
        const conversationHasStarted = state.appState.conversationStarted;

        if (hasUserMessage && conversationHasStarted) {
          throttledSetLastActivityTime();
        }

        if (action.responseType === MESSAGE_TYPE.RESP_FAQ_LIST_WITH_OPTION_INPUT) {
          lsHelpers.set(LS_KEYS.READ_FAQ_LIST, state.chatView.readFaqList);
        }
        break;

      case ACTION_TYPES.ISSUE_CREATED:
        throttledSetLastActivityTime();
        break;

      case ACTION_TYPES.SET_PROACTIVE_CHAT_RULES:
        // Proactive chat actions are to be executed based on the time on page
        // and time on site rules.
        // Set site activity start time in localstorage. This will be used to
        // check the `time on site` proactive chat condition.
        if (!lsHelpers.get(LS_KEYS.SITE_ACTIVITY_START_TIME)) {
          lsHelpers.set(LS_KEYS.SITE_ACTIVITY_START_TIME, Date.now());
        }
        break;

      case ACTION_TYPES.SET_SUGGESTED_FAQ_READ_TRACKED:
        lsHelpers.set(LS_KEYS.SUGGESTED_FAQ_READ_TRACKED, action.isTracked);
        break;

      case ACTION_TYPES.UPDATE_READ_FAQ_LIST:
        // Because the chat view reducer updates the chat view state with the
        // new FAQ ID by pushing it to the existing FAQ list, we can simply
        // set the local storage with that list.
        lsHelpers.set(LS_KEYS.READ_FAQ_LIST, state.chatView.readFaqList);
        break;

      case ACTION_TYPES.SET_DEVICE_ID:
        // Set the device id in localstorage only if it doesn't exist already.
        if (!lsHelpers.get(LS_KEYS.DEVICE_ID)) {
          lsHelpers.set(LS_KEYS.DEVICE_ID, action.id);
        }
        break;

      case ACTION_TYPES.SET_ANALYTICS_SESSION_ID:
        lsHelpers.set(LS_KEYS.ANALYTICS_SESSION_ID, action.id);
        break;

      case ACTION_TYPES.SET_RE_ENGAGEMENT_ID:
        lsHelpers.set(LS_KEYS.RE_ENGAGEMENT_ID, action.id);
        break;

      case ACTION_TYPES.RESET_RE_ENGAGEMENT_ID:
        lsHelpers.remove(LS_KEYS.RE_ENGAGEMENT_ID);
        break;

      case ACTION_TYPES.SET_LOCAL_STORAGE_DATA:
        objUtils.forEachKey(action.data, (key) => {
          lsHelpers.set(key, action.data[key]);
        });
        break;
    }
  };

  return (store) => (next) => (action) => {
    next(action);

    if (action.type === ACTION_TYPES.BATCH_ACTIONS) {
      action.actions.forEach((batchedAction) => {
        saveStateInLs(store, batchedAction);
      });
    } else {
      saveStateInLs(store, action);
    }
  };
});
