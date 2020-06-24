/**
 * App state related constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created July 26, 2017
 */

define("constants/appState", function() {
  "use strict";

  // Version of web chat (the SDK, should not be confused with the API version)
  const WEB_CHAT_VERSION = "2.55.0";

  const ISSUE_STATE = {
    // "na" (not applicable) represents the issue state value in the state when
    // no preissue or issue has been created yet. This is the default value
    // of the issue state.
    NA: "na",
    ACTIVE: "active",
    RESOLVED: "resolved",
    REJECTED: "rejected"
  };

  const ISSUE_TYPE = {
    // "initial" represents the issue type value in the state when no preissue
    // or issue has been created yet. This is the default value of issue type.
    INITIAL: "initial",
    ISSUE: "issue",
    PRE_ISSUE: "preissue"
  };

  const XHR_ISSUE_STATE = {
    PRE_ISSUE: {
      RESOLVED: "resolved",
      REJECTED: "rejected",
      ISSUE_CREATED: "issue-created"
    },
    ISSUE: {
      RESOLVED: "resolved",
      REJECTED: "rejected"
    }
  };

  const PRE_ISSUE_RESET_TIMEOUT = 86400000; // 24 hours
  const ANON_USER_RESET_TIMEOUT = 604800000; // 7 days.

  const TRIGGER = {
    RESET: "RESET"
  };

  // @TODO: Move this to the XHR_ISSUE_STATE object, getting introduced with
  // one of the next commits.
  const ISSUE_STATE_RESET = "Rejected";

  /**
   * App reset triggers represent ways by which app can be reset
   * INITIAL = The default value - Used when we reset preIssue
   * UPDATE_HELPSHIFT_CONFIG_API = Used when update helpshift config is called
   * NEW_CONV_VIA_INITIAL_USER_MESSAGE_API = Used when a new conversation starts via the
   *  setInitialUserMessage API.
   */
  const APP_RESET_TRIGGER = {
    INITIAL: "INITIAL",
    UPDATE_HELPSHIFT_CONFIG_API: "UPDATE_HELPSHIFT_CONFIG_API",
    PRE_ISSUE_RESET: "PRE_ISSUE_RESET",
    NEW_CONV_VIA_INITIAL_USER_MESSAGE_API: "NEW_CONV_VIA_INITIAL_USER_MESSAGE_API"
  };

  /**
   * Allowed empty poller iterations for creating new preIssue. After these
   * many poller iterations, create a new preIssue.
   */
  const ALLOWED_EMPTY_POLLER_COUNT = 5;

  // @TODO: Remove this constant. This is added in order to deploy a changed app.js so that the
  // cache is invalidated.
  const LIFE_UNIVERSE = 42;

  return {
    WEB_CHAT_VERSION,
    ISSUE_STATE,
    PRE_ISSUE_RESET_TIMEOUT,
    ANON_USER_RESET_TIMEOUT,
    TRIGGER,
    ISSUE_TYPE,
    ISSUE_STATE_RESET,
    XHR_ISSUE_STATE,
    APP_RESET_TRIGGER,
    ALLOWED_EMPTY_POLLER_COUNT,
    LIFE_UNIVERSE
  };
});
