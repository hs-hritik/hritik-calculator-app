/**
 * Localstorage helpers.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created Aug 3, 2017
 */

define ("helpers/localStorage",
  [
    "gunpowder/utils/localStorage"
  ],
  function (lsUtils) {
    "use strict";

    const KEYS = {
      USER_ID: "userId",
      IDENTIFIER: "identifier",
      STATE: "state",
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
      // @TODO Change the key to something cryptic.
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
     * @returns {Object|undefined} - state
     */
    const getEntities = () => {
      try {
        const serializedState = lsUtils.getItem (KEYS.STATE);
        if (serializedState === null) {
          return undefined;
        }
        return JSON.parse (serializedState);
      } catch (error) {
        // If there is any error, return undefined, so that the store
        // can be initalized with default values
        return undefined;
      }
    };

    /**
     * Save the given entities in localstorage
     * @param {Object} state - the state which has to be saved to localstorage.
     */
    const setEntities = (state) => {
      const serializedState = JSON.stringify (state);
      lsUtils.setItem (KEYS.STATE, serializedState);
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
      lsUtils.removeItem (KEYS.STATE);
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
