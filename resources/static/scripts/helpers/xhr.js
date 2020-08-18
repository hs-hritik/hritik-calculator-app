/**
 * XHR helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 21, 2017
 */

define("helpers/xhr", [
  "constants/actionTypes",
  "constants/errors",
  "gunpowder/utils/object",
  "utils/browser",
  "store",
  "constants/routes",
  "gunpowder/utils/xhr",
  "helpers/errors",
  "actions/postSdkMessage",
  "constants/actionTypes"
], function(
  actionTypes,
  errorConstants,
  objUtils,
  browserUtils,
  store,
  routes,
  xhr,
  errorHelpers,
  postSdkMessage,
  ACTION_TYPES
) {
  "use strict";

  const API_VERSION_HEADER = "application/vnd+hsapi-v2+json";

  const {
    TYPE: {NO_AUTH_TOKEN: NO_AUTH_ERROR, INVALID_USER_AUTH_TOKEN: INVALID_AUTH_ERROR},
    RESPONSE_STATUS_CODE: {
      NO_AUTH_TOKEN: NO_AUTH_RESPONSE,
      INVALID_USER_AUTH_TOKEN: INVALID_AUTH_RESPONSE
    },
    XHR_AUTO_RETRY: {BASE_TIMEOUT, TIMEOUT_MULTIPLIER, MAXIMUM_RETRY_COUNT}
  } = errorConstants;

  /**
   * Convert an object to query strings.
   * For example, {like: "a", rolling: "stone"} will be converted to
   * "like=a&rolling=stone".
   * @param {Object} obj - object to query stringify
   * @returns {string} - the query string
   */
  const _queryStringify = (obj) => {
    const qs = [];
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        qs.push(encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]));
      }
    }
    return qs.join("&");
  };

  /**
   * Return common headers which are to be passed to each xhr request.
   * @returns {Object} - header key-value pairs.
   */
  const getCommonHeaders = () => {
    const {platformId, developerSetLanguage} = store.getState().appState;
    const language = browserUtils.getLanguage();

    const headers = {
      authorization: "Basic " + btoa(platformId + ":"),
      Accept: API_VERSION_HEADER
    };

    if (developerSetLanguage) {
      headers["Accept-Language"] = `${developerSetLanguage};q=1,${language};q=0.9`;
    }

    return headers;
  };

  /**
   * Get common headers to be passed with every xhr request via axios.
   * This is needed because the xhr util adds the Content-Type header with the
   * xhr call. With axios, this helper function has to be used in order to set
   * the headers.
   * @returns {Object} - header key-value pairs.
   */
  const getCommonHeadersForAxios = () => {
    return objUtils.shallowMerge(getCommonHeaders(), {
      "Content-Type": "application/x-www-form-urlencoded"
    });
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
   *   onSuccess: () => {}
   * })
   *
   * @param {Object} [customXhrData]
   * @param {Object} [options]
   * @param {boolean} [options.skipPlatformId] - whether to skip adding platform-id
   * @param {boolean} [options.queryStringify] - whether to query-strigify xhr data
   * @returns {Object}
   */
  const getPreparedXhrData = (customXhrData, options) => {
    const skipPlatformId = options ? options.skipPlatformId : false;
    const queryStringify = options ? options.queryStringify : false;
    let xhrData;

    const {
      deviceId,
      userId,
      anonUserIdentifier,
      phoneNumber,
      userEmail,
      userAuthToken,
      platformId,
      fullPrivacyEnabled
    } = store.getState().appState;

    const commonXhrData = {
      did: deviceId
    };

    // Set `uid` to the xhr data according to the following rules.
    // If none of userId, email and phoneNumber is passed, set `uid` to `anonUserIdentifier`.
    // If userId is passed (irrespective of if email is passed), set `uid` to `userId`.
    // If userId is not passed and email is passed, don't send `uid`.
    // If email is the only identifier in fullPrivacy mode, set `uid` to `anonUserIdentifier`.
    if ((!userId && !userEmail && !phoneNumber) || (!userId && userEmail && fullPrivacyEnabled)) {
      commonXhrData.uid = anonUserIdentifier;
    } else if (userId) {
      commonXhrData.uid = userId;
    }

    if (!skipPlatformId) {
      commonXhrData["platform-id"] = platformId;
    }

    // Handle fullPrivacy mode and HMAC
    // If fullPrivacy is not enabled, send all (userId, userEmail, userAuthToken) the values.
    // If fullPrivacy is enabled then
    //    If email is not set and userId and userAuthToken are set, send userId and
    //    userAuthToken.
    //    If email is set, do not send userAuthToken
    if (!fullPrivacyEnabled) {
      if (userEmail) {
        commonXhrData.email = userEmail;
      }

      if (phoneNumber) {
        commonXhrData.phone_number = phoneNumber;
      }

      if (userAuthToken) {
        commonXhrData.user_auth_token = userAuthToken;
      }
    } else if (!userEmail && userId && userAuthToken) {
      commonXhrData.user_auth_token = userAuthToken;
    }

    // Merge custom and common XHR data objects if the passed custom data is
    // an object.
    if (objUtils.isObject(customXhrData)) {
      xhrData = objUtils.shallowMerge(commonXhrData, customXhrData);
    } else {
      xhrData = commonXhrData;
    }

    if (queryStringify) {
      return _queryStringify(xhrData);
    }
    return xhrData;
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

    // Pass the user authentication failure response to parent site
    // via postMessage API
    store.dispatch(
      postSdkMessage.onUserAuthFailure({
        type: response.status,
        message: response.responseText
      })
    );

    const {
      ui: {
        text: {errorMessage}
      }
    } = store.getState();

    let errorObj = {};

    switch (response.status) {
      case NO_AUTH_RESPONSE:
        errorObj = {
          type: NO_AUTH_ERROR,
          message: errorMessage[NO_AUTH_ERROR]
        };
        break;

      case INVALID_AUTH_RESPONSE:
        errorObj = {
          type: INVALID_AUTH_ERROR,
          message: errorMessage[INVALID_AUTH_ERROR]
        };
        break;
    }

    // Set the error object in the state, if an error is handled.
    if (Object.keys(errorObj).length > 0) {
      store.dispatch({
        type: actionTypes.ADD_ERROR,
        errorObj
      });
    }
  };

  /**
   * Function to handle auto retry for an xhr
   * @param {Number} statusCode - Response status code of the xhr
   * @param {Function} xhrCallback - Callback firing the xhr on auto retry
   * @param {Number} xhrTimeout - Time after which the xhr has to be fired
   * @param {Number} retryCount - Current retry count
   */
  const handleXhrAutoRetry = ({statusCode, xhrCallback, xhrTimeout, retryCount}) => {
    if (errorHelpers.isServerSideError(statusCode) && retryCount < MAXIMUM_RETRY_COUNT) {
      const newRetryCount = retryCount + 1;
      const newXhrTimeout = xhrTimeout * TIMEOUT_MULTIPLIER;

      setTimeout(xhrCallback.bind(this, newXhrTimeout, newRetryCount), xhrTimeout);
    }
  };

  /**
   * This function syncs push token with the backend
   * @param {Number} xhrTimeout - Time after which the xhr has to be fired
   * @param {Number} retryCount - Current retry count
   */
  const syncPushToken = (xhrTimeout = BASE_TIMEOUT, retryCount = 0) => {
    const {
      domain,
      userId,
      userName,
      phoneNumber,
      userEmail,
      userAuthToken,
      anonUserIdentifier,
      liteSdkConfig,
      fullPrivacyEnabled
    } = store.getState().appState;
    const headers = getCommonHeaders();

    xhr({
      route: routes.postPushToken(domain),
      headers,
      method: "POST",
      data: getPreparedXhrData({
        token: liteSdkConfig.pushToken
      }),
      onSuccess: (response) => {
        // This is used by lite Sdk to match the md5 hash created on the
        // their end (hash created on developer passed user details and token)
        // to know whether they want to make a network call on push token update.
        // @TODO: Lite SDK - Fix the below complex if-else block
        const userDetails = {};

        if (userName) {
          userDetails.userName = userName;
        }

        if (
          (!userId && !userEmail && !phoneNumber) ||
          (!userId && userEmail && fullPrivacyEnabled)
        ) {
          userDetails.userId = anonUserIdentifier;
        } else if (userId) {
          userDetails.userId = userId;
        }

        if (!fullPrivacyEnabled) {
          if (userEmail) {
            userDetails.userEmail = userEmail;
          }

          if (phoneNumber) {
            userDetails.phoneNumber = phoneNumber;
          }

          if (userAuthToken) {
            userDetails.userAuthToken = userAuthToken;
          }
        } else if (!userEmail && userId && userAuthToken) {
          userDetails.userAuthToken = userAuthToken;
        }

        store.dispatch(
          postSdkMessage.onPushTokenSync({
            token: response.token,
            route: routes.postPushToken(domain),
            method: "POST",
            headers,
            requestPayload: getPreparedXhrData(),
            userDetails
          })
        );

        store.dispatch({
          type: ACTION_TYPES.SYNC_PUSH_TOKEN_SUCCESS,
          payload: {
            [userId || userEmail || anonUserIdentifier]: response.token
          }
        });
      },
      onFailure: (request, statusCode) => {
        handleXhrAutoRetry({statusCode, syncPushToken, xhrTimeout, retryCount});
      }
    });
  };

  return {
    getCommonHeaders,
    getCommonHeadersForAxios,
    getPreparedXhrData,
    handleAuthFailure,
    syncPushToken
  };
});
