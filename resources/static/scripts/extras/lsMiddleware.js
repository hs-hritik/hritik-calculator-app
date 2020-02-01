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
  "helpers/localStorage"
], function(ACTION_TYPES, msgConstants, throttle, lsHelpers) {
  "use strict";

  // @TODO: Confirm what is the correct timeout for saving the
  // last activity time in localstorage.
  const LAST_ACTIVITY_THROTTLE_TIME = 20000; // 20 seconds
  const {TYPE: MESSAGE_TYPE} = msgConstants;

  const throttledSetLastActivityTime = throttle(
    lsHelpers.setLastActivityTime,
    LAST_ACTIVITY_THROTTLE_TIME,
    {
      leading: false
    }
  );

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
        lsHelpers.setUserId(action.config.userId);
        break;

      case ACTION_TYPES.APPEND_MESSAGES:
        const hasUserMessage = action.messages.some((m) => m.isCustomerMsg);
        const conversationHasStarted = state.appState.conversationStarted;

        if (hasUserMessage && conversationHasStarted) {
          throttledSetLastActivityTime();
        }

        if (action.responseType === MESSAGE_TYPE.RESP_FAQ_LIST_WITH_OPTION_INPUT) {
          lsHelpers.setReadFaqList(state.chatView.readFaqList);
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
        if (!lsHelpers.getSiteActivityStartTime()) {
          lsHelpers.setSiteActivityStartTime(Date.now());
        }
        break;

      case ACTION_TYPES.SET_SUGGESTED_FAQ_READ_TRACKED:
        lsHelpers.setSuggestedFaqReadTracked(action.isTracked, action.key);
        break;

      case ACTION_TYPES.UPDATE_READ_FAQ_LIST:
        // Because the chat view reducer updates the chat view state with the
        // new FAQ ID by pushing it to the existing FAQ list, we can simply
        // set the local storage with that list.
        lsHelpers.setReadFaqList(state.chatView.readFaqList);
        break;

      case ACTION_TYPES.SET_DEVICE_ID:
        // Set the device id in localstorage only if it doesn't exist already.
        if (!lsHelpers.getDeviceId()) {
          lsHelpers.setDeviceId(action.id);
        }
        break;

      case ACTION_TYPES.SET_ANALYTICS_SESSION_ID:
        lsHelpers.setAnalyticsSessionId(action.id);
        break;

      case ACTION_TYPES.SET_RE_ENGAGEMENT_ID:
        lsHelpers.setReEngagementId(action.id);
        break;

      case ACTION_TYPES.RESET_RE_ENGAGEMENT_ID:
        lsHelpers.removeReEngagementId();
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
