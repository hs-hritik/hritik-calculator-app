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
      IDENTIFIER: "i",
      ACTIVE_ISSUE_ID: "aii",
      USER_PROFILE_ID: "upi",
      ENTITIES_ISSUES: "ei",
      ENTITIES_MESSAGES: "em",
      ISSUE_STATE: "is",
      PRE_CHAT_FEATURE_INDEX: "pcfi",
      PRE_CHAT_FEATURE_STATE: "pcfs",
      INFO_BOT_CURRENT_FIELD: "ibcf",
      END_USER_FIRST_MSG_ID: "eufmi",
      LAST_ACTIVITY_TIME: "lat",
      REPLY_TEXT: "rt",
      SITE_ACTIVITY_START_TIME: "sast"
    };

    const USER_KEYS = ["USER_ID", "IDENTIFIER", "USER_PROFILE_ID"];

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
     * Get identifier
     * @returns {String} - identifier
     */
    const getIdentifier = () => lsUtils.getItem (KEYS.IDENTIFIER);

    /**
     * Set identifier passed to the lsUtils
     * @param {String} - userId
     */
    const setIdentifier = (identifier) => {
      lsUtils.removeItem (KEYS.USER_PROFILE_ID);
      lsUtils.setItem (KEYS.IDENTIFIER, identifier);
    };

    /**
     * Returns the entities saved in localstorage.
     * @param {String} entityType
     * @returns {Object} - entities
     */
    const getEntities = (entityType) => {
      const entityKey = `ENTITIES_${entityType}`;
      return lsUtils.getItem (KEYS [entityKey], true);
    };

    /**
     * Set the given entities in localstorage.
     * @param {String} entityType
     * @param {Object} entities - the entities which have to be saved to localstorage.
     */
    const setEntities = (entityType, entities = {}) => {
      const entityKey = `ENTITIES_${entityType}`;
      const currentEntities = getEntities (entityType) || {};
      const newEntities = objUtils.shallowMerge (currentEntities, entities);
      lsUtils.setItem (KEYS [entityKey], newEntities);
    };

    /**
     * Get the active issue id.
     * @returns {String} - active issue id
     */
    const getActiveIssueId = () => lsUtils.getItem (KEYS.ACTIVE_ISSUE_ID);

    /**
     * Set the active issue id.
     * @param {String} id - active issue id
     */
    const setActiveIssueId = (id) => {
      lsUtils.setItem (KEYS.ACTIVE_ISSUE_ID, id);
    };

    /**
     * Get the user profile id.
     * @returns {String} - profile id
     */
    const getUserProfileId = () => lsUtils.getItem (KEYS.USER_PROFILE_ID);

    /**
     * Set the user profile id.
     * @param {String} profileId
     */
    const setUserProfileId = (profileId) => {
      lsUtils.setItem (KEYS.USER_PROFILE_ID, profileId);
    };

    /**
     * Set the issue state.
     * @param {String} state - issue state
     */
    const setIssueState = (state) => {
      lsUtils.setItem (KEYS.ISSUE_STATE, state);
    };

    /**
     * Get the issue state.
     * @returns {String} - issue state
     */
    const getIssueState = () => lsUtils.getItem (KEYS.ISSUE_STATE);

    /**
     * Set pre chat feature index.
     * @param {Number} index
     */
    const setPreChatFeatureIndex = (index) => {
      lsUtils.setItem (KEYS.PRE_CHAT_FEATURE_INDEX, index);
    };

    /**
     * Get pre chat feature index.
     * @returns {Number} - index
     */
    const getPreChatFeatureIndex = () => lsUtils.getItem (KEYS.PRE_CHAT_FEATURE_INDEX, true);

    /**
     * Set pre chat feature state.
     * @param {Object} state - pre chat feature state
     */
    const setPreChatFeatureState = (state) => {
      lsUtils.setItem (KEYS.PRE_CHAT_FEATURE_STATE, state);
    };

    /**
     * Get pre chat feature state.
     * @returns {Object} - pre chat feature state
     */
    const getPreChatFeatureState = () => lsUtils.getItem (KEYS.PRE_CHAT_FEATURE_STATE, true);

    /**
     * Set info bot current field.
     * @param {String} field
     */
    const setInfoBotCurrentField = (field) => {
      lsUtils.setItem (KEYS.INFO_BOT_CURRENT_FIELD, field);
    };

    /**
     * Get info bot current field.
     * @returns {String} - info bot current field
     */
    const getInfoBotCurrentField = () => lsUtils.getItem (KEYS.INFO_BOT_CURRENT_FIELD);

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
     * Set reply text.
     * @param {String} value
     */
    const setReplyText = (value) => {
      lsUtils.setItem (KEYS.REPLY_TEXT, value);
    };

    /**
     * Get reply text.
     * @returns {String} - reply text
     */
    const getReplyText = () => lsUtils.getItem (KEYS.REPLY_TEXT);

    /**
     * Set end user first message id.
     * @param {String} id
     */
    const setEndUserFirstMsgId = (id) => {
      lsUtils.setItem (KEYS.END_USER_FIRST_MSG_ID, id);
    };

    /**
     * Get end user first message id.
     * @returns {String} id
     */
    const getEndUserFirstMsgId = () => lsUtils.getItem (KEYS.END_USER_FIRST_MSG_ID);

    /**
     * Clear previously saved state from the localstorage.
     * @param {Object} [options]
     * @param {Boolean} [options.skipUser] - Whether to skip resetting for user related data.
     *                                       By default, user related data will be reset.
     */
    const reset = (options = {}) => {
      objUtils.forEachKey (KEYS, (key) => {
        if (!(options.skipUser && (USER_KEYS.indexOf (key) !== -1))) {
          lsUtils.removeItem (KEYS [key]);
        }
      });
    };

    /**
     * Set site activity start time
     * @param {number} value
     */
    const setSiteActivityStartTime = (value) => {
      lsUtils.setItem (KEYS.SITE_ACTIVITY_START_TIME, value);
    };

    /**
     * Get site activity start time
     * @returns {number} - site activity start time
     */
    const getSiteActivityStartTime = () => lsUtils.getItem (KEYS.SITE_ACTIVITY_START_TIME);

    return {
      getUserId,
      setUserId,
      removeUserId,
      getIdentifier,
      setIdentifier,
      getEntities,
      setEntities,
      reset,
      getActiveIssueId,
      setActiveIssueId,
      getUserProfileId,
      setUserProfileId,
      setIssueState,
      getIssueState,
      setPreChatFeatureIndex,
      getPreChatFeatureIndex,
      setPreChatFeatureState,
      getPreChatFeatureState,
      setInfoBotCurrentField,
      getInfoBotCurrentField,
      setLastActivityTime,
      getLastActivityTime,
      setReplyText,
      getReplyText,
      setEndUserFirstMsgId,
      getEndUserFirstMsgId,
      setSiteActivityStartTime,
      getSiteActivityStartTime
    };
  });
