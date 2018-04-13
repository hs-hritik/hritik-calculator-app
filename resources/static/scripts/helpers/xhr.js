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
    "utils/browser",
    "store"
  ],
  function (actionTypes, errorConstants, objUtils, browserUtils, store) {
    "use strict";

    const API_VERSION_HEADER = "application/vnd+hsapi-v2+json";

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
      const {platformId, developerSetLanguage} = store.getState ().appState;
      const language = browserUtils.getLanguage ();

      const headers = {
        authorization: "Basic " + btoa (platformId + ":"),
        Accept: API_VERSION_HEADER
      };

      if (developerSetLanguage) {
        headers ["Accept-Language"] = `${developerSetLanguage};q=1,${language};q=0.9`;
      }

      return headers;
    };

    /**
     * Get the data object to be passed with the `data` field of an XHR call. It
     * merges the custom data (specific to an XHR) with the common XHR data. The
     * common XHR data contains the following.
     * 1. Device ID (did)
     * 2. User identifier (uid)
     * 3. Email (email)
     * 4. User hash (user_auth_token)
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
     * @param {Boolean} skipPlatformId - whether to skip adding platform-id
     * @returns {Object}
     */
    const getPreparedXhrData = (customXhrData, skipPlatformId) => {
      const {
        deviceId,
        userId,
        anonUserIdentifier,
        userEmail,
        userHash,
        platformId,
        fullPrivacyEnabled
      } = store.getState ().appState;

      const commonXhrData = {
        did: deviceId
      };

      // Set `uid` to the xhr data according to the following rules.
      // If none of userId and email is passed, set `uid` with `anonUserIdentifier`.
      // If userId is passed (irrespective of if email is passed), set `uid` with `userId`.
      // If userId is not passed and email is passed, don't send `uid`.
      if (!userId && !userEmail) {
        commonXhrData.uid = anonUserIdentifier;
      } else if (userId) {
        commonXhrData.uid = userId;
      }

      if (!skipPlatformId) {
        commonXhrData ["platform-id"] = platformId;
      }

      // Handle fullPrivacy mode and HMAC
      // If fullPrivacy is not enabled, send all (userId, userEmail, userHash) the values.
      // If fullPrivacy is enabled then
      //    If email is not set and userId and userHash are set, send userId and
      //    userHash.
      //    If email is set, do not send userHash
      if (!fullPrivacyEnabled) {
        if (userEmail) {
          commonXhrData.email = userEmail;
        }

        if (userHash) {
          commonXhrData.user_auth_token = userHash;
        }
      } else if (!userEmail && userId && userHash) {
        commonXhrData.user_auth_token = userHash;
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
