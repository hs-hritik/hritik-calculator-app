/**
 * XHR helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 21, 2017
 */

define ("helpers/xhr",
  [
    "constants/actionTypes",
    "constants/errors",
    "gunpowder/utils/object",
    "store"
  ],
  function (actionTypes, errorConstants, objUtils, store) {
    "use strict";

    const {
      TYPE: {
        NO_AUTH_TOKEN: NO_AUTH_ERROR,
        INVALID_USER_AUTH_TOKEN: INVALID_AUTH_ERROR
      },
      RESPONSE_STATUS_CODE: {
        NO_AUTH_TOKEN: NO_AUTH_RESPONSE,
        INVALID_USER_AUTH_TOKEN: INVALID_AUTH_RESPONSE
      }
    } = errorConstants;

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

    /**
     * Handle user authentication failures. All Web Chat APIs are going to be
     * validated for user authentication. This is the common handler that sets
     * appropriate error object (with type and message) in the state.
     * @param {Object} response - The response object sent by the API, with status.
     */
    const handleAuthFailure = (response) => {
      if (!(response && response.status)) {
        return;
      }

      const {
        ui: {
          text: {
            errorMessage
          }
        }
      } = store.getState ();

      let errorObj = {};

      switch (response.status) {
        case NO_AUTH_RESPONSE:
          errorObj = {
            type: NO_AUTH_ERROR,
            message: errorMessage [NO_AUTH_ERROR]
          };
          break;

        case INVALID_AUTH_RESPONSE:
          errorObj = {
            type: INVALID_AUTH_ERROR,
            message: errorMessage [INVALID_AUTH_ERROR]
          };
          break;
      }

      // Set the error object in the state, if an error is handled.
      if (Object.keys (errorObj).length > 0) {
        store.dispatch ({
          type: actionTypes.ADD_ERROR,
          errorObj
        });
      }
    };

    return {
      getCommonHeaders,
      getPreparedXhrData,
      handleAuthFailure
    };
  });
