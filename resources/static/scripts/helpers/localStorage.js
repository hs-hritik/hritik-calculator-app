/**
 * Localstorage helpers.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created Aug 3, 2017
 */

define("helpers/localStorage", [
  "gunpowder/utils/localStorage",
  "gunpowder/utils/object",
  "gunpowder/utils/pubsub"
], function(lsUtils, objUtils, pubsub) {
  "use strict";

  const KEYS = {
    USER_ID: "ui",
    DEVICE_ID: "di",
    ANALYTICS_SESSION_ID: "asi",
    ANON_USER_ID: "aui",
    LAST_ACTIVITY_TIME: "lat",
    SITE_ACTIVITY_START_TIME: "sast",
    PROACTIVE_CHAT_HAS_TRIGGERED: "pcht",
    SUGGESTED_FAQ_READ_TRACKED: "sfrt",
    READ_FAQ_LIST: "rfl",
    LS_MIGRATED: "lm",
    RE_ENGAGEMENT_REDIRECTED: "redirected",
    RE_ENGAGEMENT_DATA: "red",
    RE_ENGAGEMENT_ID: "rid",
    WIDGET_SHOULD_AUTO_OPEN: "wsao",
    PFI_VALUE: "pfi",
    CONFIG: "config",
    RESPECT_PFI: "rf",
    WS_CONFIG: "wsc"
  };

  const PROACTIVE_CHAT_KEYS = ["SITE_ACTIVITY_START_TIME", "PROACTIVE_CHAT_HAS_TRIGGERED"];

  // The DEVICE_ID key should never be reset. We use DEVICE_ID to
  // identify a browser (the device). Its value should remain the
  // same irrespective of who (the user) is using it.
  // The analytics session id should not reset. It is supposed to be reset
  // only when a new conversation starts.
  const NON_RESETABLE_KEYS = [
    "USER_ID",
    "ANON_USER_ID",
    "DEVICE_ID",
    "ANALYTICS_SESSION_ID",
    "WS_CONFIG"
  ];

  const LS_UPDATE_TYPES = {
    SET: "set",
    REMOVE: "remove"
  };

  /**
   * A helper function to check if a localstorage key should be
   * cleared. It depends on the `options` object passed with the
   * `reset` call and NON_RESETABLE_KEYS.
   *
   * @param {string} key
   * @param {Object} [options]
   * @param {Boolean} [options.resetProactiveChat] - Whether to reset proactive chat
   *                  related data. By default, they won't be reset.
   * @returns {boolean}
   */
  const _shouldKeyReset = (key, options) => {
    return (
      !(NON_RESETABLE_KEYS.indexOf(key) !== -1) &&
      !(!options.resetProactiveChat && PROACTIVE_CHAT_KEYS.indexOf(key) !== -1)
    );
  };

  /**
   * Clear previously saved state from the localstorage.
   * @param {Object} [options]
   * @param {Boolean} [options.resetProactiveChat] - Whether to reset proactive chat
   *                  related data. By default, they won't be reset.
   */
  const reset = (options = {}) => {
    const keysToBeRemoved = [];

    objUtils.forEachKey(KEYS, (key) => {
      if (_shouldKeyReset(key, options)) {
        keysToBeRemoved.push(KEYS[key]);
        lsUtils.removeItem(KEYS[key]);
      }
    });

    pubsub.fire("LS_UPDATE", {type: LS_UPDATE_TYPES.REMOVE, data: {data: keysToBeRemoved}});
  };

  /**
   * Set data in the local storage
   * @param {string} key - Key to set in ls
   * @param {string} value - Value to be set against the ls. JSON.stringify the value if its an
   * object or an array.
   */
  const set = (key, value, onLocalStorageFull) => {
    if (key) {
      lsUtils.setItem(key, value, null, onLocalStorageFull);
      // Fire a ls update event to communicate it to parent site
      pubsub.fire("LS_UPDATE", {type: LS_UPDATE_TYPES.SET, data: {[key]: value}});
    }
  };

  /**
   * Returns the corresponding item in the local storage
   * @param {string} key
   * @param {Boolean} parse - pass true if you want to JSON.parse the value
   */
  const get = (key, parse = false) => {
    if (key) {
      return lsUtils.getItem(key, parse);
    }
  };

  /**
   * Removes a key from the local storage
   * @param {string} key
   */
  const remove = (key) => {
    if (key) {
      lsUtils.removeItem(key);
      // Fire a ls update event to communicate it to parent site
      pubsub.fire("LS_UPDATE", {type: LS_UPDATE_TYPES.REMOVE, data: {data: [key]}});
    }
  };

  return {
    LS_KEYS: KEYS,
    LS_UPDATE_TYPES,
    set,
    get,
    remove,
    reset
  };
});
