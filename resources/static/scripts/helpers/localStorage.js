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

    // @TODO: Change the keys to something cryptic.
    const KEYS = {
      USER_ID: "userId",
      IDENTIFIER: "identifier",
      ENTITIES: {
        ISSUES: "issues_entities",
        MESSAGES: "messages_entities"
      },
      ACTIVE_ISSUE_ID: "active_issue_id",
      IS_IDENTIFIER_REGISTERED: "is_identifier_registered",
      ISSUE_STATE: "issue_state",
      PRE_CHAT_FEATURE_INDEX: "pre_chat_feature_index",
      PRE_CHAT_FEATURE_STATE: "pre_chat_feature_state",
      INFO_BOT_CURRENT_FIELD: "info_bot_current_field",
      LAST_ACTIVITY_TIME: "last_activity_time"
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
     * Get identifier
     * @returns {String} - identifier
     */
    const getIdentifier = () => lsUtils.getItem (KEYS.IDENTIFIER);

    /**
     * Set identifier passed to the lsUtils
     * @param {String} - userId
     */
    const setIdentifier = (identifier) => {
      // @TODO Change the key to something cryptic.
      lsUtils.setItem (KEYS.IDENTIFIER, identifier);
    };

    /**
     * Returns the entities saved in localstorage.
     * @param {String} entityType
     * @returns {Object} - entities
     */
    const getEntities = (entityType) => {
      return lsUtils.getItem (KEYS.ENTITIES [entityType], true);
    };

    /**
     * Set the given entities in localstorage.
     * @param {String} entityType
     * @param {Object} entities - the entities which have to be saved to localstorage.
     */
    const setEntities = (entityType, entities = {}) => {
      const currentEntities = getEntities (entityType) || {};
      const newEntities = objUtils.shallowMerge (currentEntities, entities);
      lsUtils.setItem (KEYS.ENTITIES [entityType], newEntities);
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
     * Get the identifier registered information.
     * @returns {Boolean} - true if the identifier is registered.
     */
    // @TODO: Check if parse would be required.
    const getIdentifierRegisteredInfo = () => lsUtils.getItem (KEYS.IS_IDENTIFIER_REGISTERED);

    /**
     * Set the identifier registered information.
     * @param {Boolean} registered
     */
    const setIdentifierRegisteredInfo = (registered) => {
      lsUtils.setItem (KEYS.IS_IDENTIFIER_REGISTERED, registered);
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
     * Clear previously saved state from the localstorage.
     */
    const reset = () => {
      lsUtils.removeItem (KEYS.ENTITIES.ISSUES);
      lsUtils.removeItem (KEYS.ENTITIES.MESSAGES);
      lsUtils.removeItem (KEYS.ACTIVE_ISSUE_ID);
      // @TODO: Remove IS_IDENTIFIER_REGISTERED key when saving new identifier.
      lsUtils.removeItem (KEYS.ISSUE_STATE);
      lsUtils.removeItem (KEYS.PRE_CHAT_FEATURE_INDEX);
      lsUtils.removeItem (KEYS.PRE_CHAT_FEATURE_STATE);
      lsUtils.removeItem (KEYS.INFO_BOT_CURRENT_FIELD);
    };

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
      getIdentifierRegisteredInfo,
      setIdentifierRegisteredInfo,
      setIssueState,
      getIssueState,
      setPreChatFeatureIndex,
      getPreChatFeatureIndex,
      setPreChatFeatureState,
      getPreChatFeatureState,
      setInfoBotCurrentField,
      getInfoBotCurrentField,
      setLastActivityTime,
      getLastActivityTime
    };
  });
