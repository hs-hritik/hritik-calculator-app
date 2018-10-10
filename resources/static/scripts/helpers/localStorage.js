/**
 * Localstorage helpers.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created Aug 3, 2017
 */

define ("helpers/localStorage",
  [
    "gunpowder/utils/localStorage",
    "gunpowder/utils/object"
  ],
  function (lsUtils, objUtils) {
    "use strict";

    const KEYS = {
      USER_ID: "ui",
      DEVICE_ID: "di",
      ANON_USER_ID: "aui",
      LAST_ACTIVITY_TIME: "lat",
      SITE_ACTIVITY_START_TIME: "sast",
      PROACTIVE_CHAT_HAS_TRIGGERED: "pcht",
      SUGGESTED_FAQ_READ_TRACKED: "sfrt",
      READ_FAQ_LIST: "rfl",
      LS_MIGRATED: "lm",
      RE_ENGAGEMENT_REDIRECTED: "redirected",
      RE_ENGAGEMENT_DATA: "red",
      RE_ENGAGEMENT_ID: "rid"
    };

    const USER_KEYS = ["USER_ID", "ANON_USER_ID"];
    const PROACTIVE_CHAT_KEYS = ["SITE_ACTIVITY_START_TIME", "PROACTIVE_CHAT_HAS_TRIGGERED"];
    const DEVICE_ID_KEY = "DEVICE_ID";

    /**
     * A helper function to check if a localstorage key should be
     * cleared. It depends on the `options` object passed with the
     * `reset` call and, of course, the key.
     * The DEVICE_ID key should never be reset. We use DEVICE_ID to
     * identify a browser (the device). Its value should remain the
     * same irrespective of who (the user) is using it.
     *
     * @param {string} key
     * @param {Object} [options]
     * @param {Boolean} [options.resetProactiveChat] - Whether to reset proactive chat
     *                  related data. By default, they won't be reset.
     * @returns {boolean}
     */
    const _shouldKeyReset = (key, options) => {
      return !(USER_KEYS.indexOf (key) !== -1) &&
             !(!options.resetProactiveChat && (PROACTIVE_CHAT_KEYS.indexOf (key) !== -1)) &&
             !(key === DEVICE_ID_KEY);
    };

    /**
     * Get userId
     * @returns {String} - userId
     */
    const getUserId = () => lsUtils.getItem (KEYS.USER_ID);

    /**
     * Set user id passed with the client config to the lsUtils
     * @param {String} - userId
     */
    const setUserId = (userId) => {
      lsUtils.setItem (KEYS.USER_ID, userId);
    };

    /**
     * Remove userId
     */
    const removeUserId = () => lsUtils.removeItem (KEYS.USER_ID);

    /**
     * Get the device id
     * @returns {string}
     */
    const getDeviceId = () => lsUtils.getItem (KEYS.DEVICE_ID);

    /**
     * Set the device id passed to the lsUtils
     * @param {string} - id
     */
    const setDeviceId = (id) => {
      lsUtils.setItem (KEYS.DEVICE_ID, id);
    };

    /**
     * Get anon user id
     * @returns {string}
     */
    const getAnonUserId = () => lsUtils.getItem (KEYS.ANON_USER_ID);

    /**
     * Set anon user id
     * @param {string} - id
     */
    const setAnonUserId = (id) => {
      lsUtils.setItem (KEYS.ANON_USER_ID, id);
    };

    /**
     * Remove anon user id
     */
    const removeAnonUserId = () => lsUtils.removeItem (KEYS.ANON_USER_ID);

    /**
     * Set last activity time to current time.
     */
    const setLastActivityTime = () => {
      lsUtils.setItem (KEYS.LAST_ACTIVITY_TIME, Date.now ());
    };

    /**
     * Get last activity time.
     * @returns {Number} - last activity time in ms.
     */
    const getLastActivityTime = () => lsUtils.getItem (KEYS.LAST_ACTIVITY_TIME, true);

    /**
     * Clear previously saved state from the localstorage.
     * @param {Object} [options]
     * @param {Boolean} [options.skipUser] - Whether to skip resetting for user related data.
     *                  By default, user related data will be reset.
     * @param {Boolean} [options.resetProactiveChat] - Whether to reset proactive chat
     *                  related data. By default, they won't be reset.
     */
    const reset = (options = {}) => {
      objUtils.forEachKey (KEYS, (key) => {
        if (_shouldKeyReset (key, options)) {
          lsUtils.removeItem (KEYS [key]);
        }
      });
    };

    /**
     * Set site activity start time
     * @param {number} value - unix timestamp
     */
    const setSiteActivityStartTime = (value) => {
      lsUtils.setItem (KEYS.SITE_ACTIVITY_START_TIME, value);
    };

    /**
     * Get site activity start time
     * @returns {number} - site activity start time
     */
    const getSiteActivityStartTime = () => lsUtils.getItem (KEYS.SITE_ACTIVITY_START_TIME);

    /**
     * Set whether a proactive chat has triggered on the site or not
     * @param {boolean} triggered
     */
    const setProactiveChatHasTriggered = (triggered) => {
      lsUtils.setItem (KEYS.PROACTIVE_CHAT_HAS_TRIGGERED, triggered);
    };

    /**
     * Get whether a proactive chat has triggered on the site or not
     * @returns {boolean}
     */
    const getProactiveChatHasTriggered = () => lsUtils.getItem (KEYS.PROACTIVE_CHAT_HAS_TRIGGERED);

    /**
     * Set whether the suggested FAQ read event has been tracked or not
     * @param {boolean} isTracked
     */
    const setSuggestedFaqReadTracked = (isTracked) => {
      lsUtils.setItem (KEYS.SUGGESTED_FAQ_READ_TRACKED, isTracked);
    };

    /**
     * Get whether the suggested FAQ read event has been tracked or not
     * @returns {boolean}
     */
    const getSuggestedFaqReadTracked = () => !!lsUtils.getItem (KEYS.SUGGESTED_FAQ_READ_TRACKED);

    /**
     * Set the read FAQ list.
     * @param {array} faqList
     */
    const setReadFaqList = (faqList) => {
      lsUtils.setItem (KEYS.READ_FAQ_LIST, faqList);
    };

    /**
     * Get the read FAQ list.
     * @returns {string}
     */
    const getReadFaqList = () => lsUtils.getItem (KEYS.READ_FAQ_LIST, true);

    /**
     * Set a flag denoting the localStorage migration completion.
     */
    const setLsMigrated = () => {
      lsUtils.setItem (KEYS.LS_MIGRATED, true);
    };

    /**
     * Get a flag denoting the localStorage migration completion.
     * @returns {boolean}
     */
    const getLsMigrated = () => !!lsUtils.getItem (KEYS.LS_MIGRATED);

    /**
     * Get a flag denoting that the user has been redirected for
     * re-engagement in the ongoing conversation.
     * @returns {boolean}
     */
    const getRedirectedFlag = () => !!lsUtils.getItem (KEYS.RE_ENGAGEMENT_REDIRECTED);

    /**
     * Get & parse the re-engagement data
     * @returns {Object}
     */
    const getReEngagementData = () => lsUtils.getItem (KEYS.RE_ENGAGEMENT_DATA, true);

    /**
     * Set re-engagement id
     * @param {String} id - re-engagement id
     */
    const setReEngagementId = (id) => lsUtils.setItem (KEYS.RE_ENGAGEMENT_ID, id);

    /**
     * Get re-engagement id
     * @returns {String} re-engagement id
     */
    const getReEngagementId = () => lsUtils.getItem (KEYS.RE_ENGAGEMENT_ID);

    /**
     * Remove re-engagement related data from local storage
     */
    const removeReEngagementData = () => {
      lsUtils.removeItem (KEYS.RE_ENGAGEMENT_REDIRECTED);
      lsUtils.removeItem (KEYS.RE_ENGAGEMENT_DATA);
    };

    const removeReEngagementId = () => lsUtils.removeItem (KEYS.RE_ENGAGEMENT_ID);

    return {
      LS_KEYS: KEYS,
      getUserId,
      setUserId,
      removeUserId,
      getDeviceId,
      setDeviceId,
      getAnonUserId,
      setAnonUserId,
      removeAnonUserId,
      reset,
      setLastActivityTime,
      getLastActivityTime,
      setSiteActivityStartTime,
      getSiteActivityStartTime,
      setProactiveChatHasTriggered,
      getProactiveChatHasTriggered,
      setSuggestedFaqReadTracked,
      getSuggestedFaqReadTracked,
      setReadFaqList,
      getReadFaqList,
      setLsMigrated,
      getLsMigrated,
      getRedirectedFlag,
      getReEngagementData,
      setReEngagementId,
      getReEngagementId,
      removeReEngagementData,
      removeReEngagementId
    };
  });
