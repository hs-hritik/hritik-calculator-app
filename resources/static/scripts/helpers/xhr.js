/**
 * XHR helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 21, 2017
 */

define ("helpers/xhr",
  [
    "gunpowder/utils/object",
    "store"
  ],
  function (objUtils, store) {
    "use strict";

    /**
     * Return common headers which are to be passed to each xhr request.
     * @returns {Object} - header key-value pairs.
     */
    const getCommonHeaders = () => {
      const {platformId} = store.getState ().appState;
      return {
        authorization: "Basic " + btoa (platformId + ":")
      };
    };

    /**
     * Get the data object to be passed with the `data` field of an XHR call. It
     * merges the custom data (specific to an XHR) with the common XHR data. The
     * common XHR data contains the following.
     * 1. Device ID (did)
     * 2. User identifier (uid)
     * 3. Email (email)
     * 4. User hash (hash)
     * 5. Platform ID (platform_id)
     *
     * This function has to be used as following.
     * xhr ({
     *   path :"/foo",
     *   data: xhrHelpers.getPreparedXhrData ({
     *     foo: "a",
     *     bar: "b"
     *   }),
     *   onSucess: () => {}
     * })
     *
     * @param {Object} customXhrData
     * @returns {Object}
     */
    const getPreparedXhrData = (customXhrData) => {
      const {
        deviceId,
        userId,
        anonUserIdentifier,
        userEmail,
        userHash,
        platformId
      } = store.getState ().appState;

      const commonXhrData = {
        did: deviceId,
        uid: userId ? userId : anonUserIdentifier,
        platform_id: platformId
      };

      if (userEmail) {
        commonXhrData.email = userEmail;
      }

      if (userHash) {
        commonXhrData.hash = userHash;
      }

      // Merge custom and common XHR data objects if the passed custom data is
      // an object.
      if (objUtils.isObject (customXhrData)) {
        return objUtils.shallowMerge (commonXhrData, customXhrData);
      }

      return commonXhrData;
    };

    return {
      getCommonHeaders,
      getPreparedXhrData
    };
  });
