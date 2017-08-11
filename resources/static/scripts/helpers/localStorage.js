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
      IS_IDENTIFIER_REGISTERED: "is_identifier_registered"
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
     * @returns {Number} - active issue id
     */
    const getActiveIssueId = () => lsUtils.getItem (KEYS.ACTIVE_ISSUE_ID);

    /**
     * Set the active issue id.
     * @param {Number} id - active issue id
     */
    const setActiveIssueId = (id) => {
      lsUtils.setItem (KEYS.ACTIVE_ISSUE_ID, id);
    };

    /**
     * Get the identifier registered information.
     * @returns {Boolean} - true if the identifier is registered.
     */
    const getIdentifierRegisteredInfo = () => lsUtils.getItem (KEYS.IS_IDENTIFIER_REGISTERED);

    /**
     * Set the identifier registered information.
     * @param {Boolean} registered
     */
    const setIdentifierRegisteredInfo = (registered) => {
      lsUtils.setItem (KEYS.IS_IDENTIFIER_REGISTERED, registered);
    };

    /**
     * Clear previously saved state from the localstorage.
     */
    const reset = () => {
      lsUtils.removeItem (KEYS.ENTITIES.ISSUES);
      lsUtils.removeItem (KEYS.ENTITIES.MESSAGES);
      lsUtils.removeItem (KEYS.ACTIVE_ISSUE_ID);
      lsUtils.removeItem (KEYS.IS_IDENTIFIER_REGISTERED);
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
      setIdentifierRegisteredInfo
    };
  });
