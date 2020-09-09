/**
 * UI Errors related constants.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Nov 7, 2017
 */

define("constants/errors", function() {
  "use strict";

  const FILE_UPLOAD_ERRORS = {
    SIZE_EXCEEDED: 1,
    RETRY: 2,
    FAILURE: 3,
    ABORTED: 4,
    INVALID_TYPE: 5
  };

  const RESPONSE_STATUS_CODE = {
    NO_AUTH_TOKEN: 401,
    INVALID_USER_AUTH_TOKEN: 403,
    PRE_ISSUE_EXISTS: 204,
    UNSUPPORTED_MEDIA_TYPE: 415,
    GATEWAY_TIMEOUT: 504
  };

  const TYPE = {
    NO_AUTH_TOKEN: "NO_AUTH_TOKEN",
    INVALID_USER_AUTH_TOKEN: "INVALID_USER_AUTH_TOKEN",
    PRE_ISSUE_FAILURE: "PRE_ISSUE_FAILURE",
    PRE_ISSUE_TIME_OUT: "PRE_ISSUE_TIME_OUT"
  };

  const XHR_AUTO_RETRY = {
    BASE_TIMEOUT: 3000, // in milliseconds
    TIMEOUT_MULTIPLIER: 2,
    MAXIMUM_RETRY_COUNT: 5
  };

  return {
    FILE_UPLOAD_ERRORS,
    RESPONSE_STATUS_CODE,
    TYPE,
    XHR_AUTO_RETRY
  };
});
