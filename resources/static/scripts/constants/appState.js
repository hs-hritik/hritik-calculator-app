/**
 * App state related constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created July 26, 2017
 */

define ("constants/appState",
  function () {
    "use strict";

    // Version of web chat (the SDK, should not be confused with the API version)
    const WEB_CHAT_VERSION = "2.31.1";

    const ISSUE_STATE = {
      ACTIVE: "active",
      RESOLVED: "resolved",
      REJECTED: "rejected"
    };

    const ISSUE_TYPE = {
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
     * START_NEW_CONVERSATION = Used when user clicks on start new conversation
     */
    const APP_RESET_TRIGGER = {
      INITIAL: "INITIAL",
      UPDATE_HELPSHIFT_CONFIG_API: "UPDATE_HELPSHIFT_CONFIG_API",
      START_NEW_CONVERSATION: "START_NEW_CONVERSATION",
      PRE_ISSUE_RESET: "PRE_ISSUE_RESET"
    };

    /**
     * Allowed empty poller iterations for creating new preIssue. After these
     * many poller iterations, create a new preIssue.
     */
    const ALLOWED_EMPTY_POLLER_COUNT = 5;

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
      ALLOWED_EMPTY_POLLER_COUNT
    };
  });
