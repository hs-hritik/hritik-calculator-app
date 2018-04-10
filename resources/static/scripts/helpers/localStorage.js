/**
 * Localstorage helpers.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created Aug 3, 2017
 */

define ("helpers/localStorage",
  [
    "constants/message",
    "gunpowder/utils/localStorage",
    "gunpowder/utils/object"
  ],
  function (MESSAGE_CONSTANTS, lsUtils, objUtils) {
    "use strict";

    const KEYS = {
      USER_ID: "ui",
      DEVICE_ID: "di",
      ANON_USER_ID: "aui",
      ACTIVE_ISSUE_ID: "aii",
      INTERNAL_ISSUE_ID: "iii",
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
      SITE_ACTIVITY_START_TIME: "sast",
      PROACTIVE_CHAT_HAS_TRIGGERED: "pcht",
      SUGGESTED_FAQ_READ_TRACKED: "sfrt",
      READ_FAQ_LIST: "rfl"
    };

    const USER_KEYS = ["USER_ID", "ANON_USER_ID", "USER_PROFILE_ID"];
    const PROACTIVE_CHAT_KEYS = ["SITE_ACTIVITY_START_TIME", "PROACTIVE_CHAT_HAS_TRIGGERED"];
    const DEVICE_ID_KEY = "DEVICE_ID";

    const {ATTACHMENT} = MESSAGE_CONSTANTS.TYPE;

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
     * @param {Boolean} [options.skipUser] - Whether to skip resetting for user related data.
     *                  By default, user related data will be reset.
     * @param {Boolean} [options.resetProactiveChat] - Whether to reset proactive chat
     *                  related data. By default, they won't be reset.
     * @returns {boolean}
     */
    const _shouldKeyReset = (key, options) => {
      return !(options.skipUser && (USER_KEYS.indexOf (key) !== -1)) &&
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
     * Get the internal issue ID.
     * @returns {string}
     */
    const getInternalIssueId = () => lsUtils.getItem (KEYS.INTERNAL_ISSUE_ID);

    /**
     * Set the internal issue ID.
     * @param {string} id
     */
    const setInternalIssueId = (id) => {
      lsUtils.setItem (KEYS.INTERNAL_ISSUE_ID, id);
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
     * Removes message from entities
     * @param {String} issueId - current issue id
     * @param {String} messageId - message id to remove
     */
    const removeMessage = (issueId, messageId) => {
      // Remove message id from 'issues->messages' entity
      const issueEntities = getEntities ("ISSUES");
      const filteredMessages = issueEntities [issueId].messages.filter ((message) => {
        return message !== messageId;
      });
      const newIssueEntities = objUtils.setIn (
        issueEntities, filteredMessages, [issueId, "messages"]
      );

      lsUtils.setItem (KEYS.ENTITIES_ISSUES, newIssueEntities);

      // Remove message from 'message' entity
      const messagesEntities = getEntities ("MESSAGES");
      delete messagesEntities [messageId];
      lsUtils.setItem (KEYS.ENTITIES_MESSAGES, messagesEntities);
    };

    /**
     * Removes dummy messages from local storage
     * a] Remove dummy message data from 'messages' entity
     * b] Remove dummy message id from 'issue->messages'
     */
    const removeDummyMessages = () => {
      const issueId = getActiveIssueId ();
      const messagesEntities = getEntities ("MESSAGES") || {};
      const newMessageEntities = {};
      const dummyMessageIds = [];

      // This function performs two tasks
      // a] Remove dummy messages from 'message' entity
      //    - Loop on all the messages from message entity.
      //    - If there are any dummy messages, group their ids in an array
      // b] Remove dummy message ids from 'issue->messages'
      //    - Loop on dummy message ids array and check that message id
      //      is present in 'issue->message'
      //    - If present, skip adding in new message entity i.e. remove dummy message ids

      // a] Remove dummy message from 'message' entity
      objUtils.forEachKey (messagesEntities, (key, messageEntity) => {
        // For now we are removing message of type attachment only
        // If required add a type or some other identifier to remove those
        // messages after page refresh
        if (messageEntity.type === ATTACHMENT) {
          dummyMessageIds.push (key);
        } else {
          newMessageEntities [key] = messageEntity;
        }
      });

      // If dummy messages are not present, then local storage is clean.
      // No need to further process anything!
      if (!dummyMessageIds.length) {
        return;
      }

      lsUtils.setItem (KEYS.ENTITIES_MESSAGES, newMessageEntities);

      // b] Remove dummy message id from 'issue->message'
      const issueEntities = getEntities ("ISSUES") || {};
      const issueMessages = issueEntities [issueId].messages;

      dummyMessageIds.forEach ((dummyIssueId) => {
        const dummyIssueIndex = issueMessages.indexOf (dummyIssueId);
        if (dummyIssueIndex !== -1) {
          issueMessages.splice (dummyIssueIndex, 1);
        }
      });

      const newIssueEntities = objUtils.setIn (
        issueEntities, issueMessages, [issueId, "messages"]
      );

      lsUtils.setItem (KEYS.ENTITIES_ISSUES, newIssueEntities);
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
    const getSuggestedFaqReadTracked = () => lsUtils.getItem (KEYS.SUGGESTED_FAQ_READ_TRACKED);

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

    return {
      getUserId,
      setUserId,
      removeUserId,
      getDeviceId,
      setDeviceId,
      getAnonUserId,
      setAnonUserId,
      getEntities,
      setEntities,
      reset,
      getActiveIssueId,
      setActiveIssueId,
      getInternalIssueId,
      setInternalIssueId,
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
      removeMessage,
      removeDummyMessages,
      setSiteActivityStartTime,
      getSiteActivityStartTime,
      setProactiveChatHasTriggered,
      getProactiveChatHasTriggered,
      setSuggestedFaqReadTracked,
      getSuggestedFaqReadTracked,
      setReadFaqList,
      getReadFaqList
    };
  });
