/**
 * Localstorage helpers.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created Aug 3, 2017
 */

define ("helpers/localStorage",
  ["gunpowder/utils/localStorage"],
  function (lsUtils) {
    "use strict";

    const KEYS = {
      USER_ID: "userId",
      UUID: "uuid"
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
     * Get uuid
     * @returns {String} - uuid
     */
    const getUuid = () => lsUtils.getItem (KEYS.UUID);

    /**
     * Set uuid passed to the lsUtils
     * @param {String} - userId
     */
    const setUuid = (uuid) => {
      // @TODO Change the key to something cryptic.
      lsUtils.setItem (KEYS.UUID, uuid);
    };

    return {
      getUserId,
      setUserId,
      removeUserId,
      getUuid,
      setUuid
    };
  });
