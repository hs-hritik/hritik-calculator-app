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
   * Handle the case when localstorage gets full
   * Most occuping space in localstorage is the config key value pair.
   * Remove all the config stored by removing the config object and
   * store the lastest config in the local storage.
   * @param {Object} action
   * @param {String} action.uniqueUserIdentifier - A unique key to identify a user
   * @param {Number} action.currentTime - Current time in milliseconds
   * @param {Object} action.config - Config data
   */
  const _onLocalStorageFull = (action) => {
    lsHelpers.remove(LS_KEYS.CONFIG);
    lsHelpers.set(LS_KEYS.CONFIG, {
      [action.uniqueUserIdentifier]: {
        config: action.config,
        lastConfigFetchTs: action.currentTime,
        issueExistsDataIsStaleInLocalStorage: false
      }
    });
  };

  /**
   * Returns the updated Config Object
   * @param {Object} action
   * @param {String} action.uniqueUserIdentifier - Unique identifier of a user
   * @param {Number} action.currentTime - Current time in milliseconds
   * @returns {Object} - Returns the updated config object
   */
  const _getUpdatedConfig = (action) => {
    let configObject = lsHelpers.get(LS_KEYS.CONFIG, true);

    // The value is stale when the issue exists is true and
    // create pre-issue is succeded or the value is not set
    if (configObject) {
      configObject[action.uniqueUserIdentifier] = {
        config: action.config,
        lastConfigFetchTs: action.currentTime,
        issueExistsDataIsStaleInLocalStorage: false
      };
    } else {
      configObject = {
        [action.uniqueUserIdentifier]: {
          config: action.config,
          lastConfigFetchTs: action.currentTime,
          issueExistsDataIsStaleInLocalStorage: false
        }
      };
    }

    return configObject;
  };

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

      case ACTION_TYPES.CREATE_PREISSUE_SUCCESS:
        throttledSetLastActivityTime();

        const {userIdentifier, issueExists} = action;

        if (!issueExists) {
          const configMap = lsHelpers.get(LS_KEYS.CONFIG, true);

          if (configMap) {
            configMap[userIdentifier].issueExistsDataIsStaleInLocalStorage = !issueExists;

            lsHelpers.set(LS_KEYS.CONFIG, configMap);
          }
        }
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

      case ACTION_TYPES.USER_REPLY_REQUEST:
        // If the user replies on a re-engaged issue, reset the reEngagementId because re-engagement
        // is over with the user reply.
        if (action.reEngagementId) {
          lsHelpers.remove(LS_KEYS.RE_ENGAGEMENT_ID);
        }
        break;

      case ACTION_TYPES.SET_WIDGET_SHOULD_AUTO_OPEN:
        lsHelpers.set(LS_KEYS.WIDGET_SHOULD_AUTO_OPEN, action.widgetShouldAutoOpen);
        break;

      case ACTION_TYPES.SET_LITE_SDK_CONFIG:
        objUtils.forEachKey(action.data.localStorageData, (key) => {
          lsHelpers.set(key, action.data.localStorageData[key]);
        });
        break;

      case ACTION_TYPES.FETCH_CONFIG_SUCCESS:
        if (action.updateLs) {
          // The config is stored as a property in nested object
          // The key is user unique identifier and the value is an object with
          // the timestamp and config as property
          const config = _getUpdatedConfig(action);
          const onLocalStorageOutOfSpace = _onLocalStorageFull.bind(null, action);

          if (action.config.config_fetch_interval) {
            lsHelpers.set(LS_KEYS.PFI_VALUE, action.config.config_fetch_interval);
          } else {
            lsHelpers.set(LS_KEYS.PFI_VALUE, 0);
          }

          lsHelpers.set(LS_KEYS.CONFIG, config, onLocalStorageOutOfSpace);
        }
        break;

      case ACTION_TYPES.WS_CONFIG_SUCCESS:
        lsHelpers.set(LS_KEYS.WS_CONFIG, btoa(JSON.stringify(action.payload)));
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
