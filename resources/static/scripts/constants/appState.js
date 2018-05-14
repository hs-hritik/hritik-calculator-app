/**
 * App state related constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created July 26, 2017
 */

define ("constants/appState",
  function () {
    "use strict";

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

    return {
      ISSUE_STATE,
      PRE_ISSUE_RESET_TIMEOUT,
      ANON_USER_RESET_TIMEOUT,
      TRIGGER,
      ISSUE_TYPE,
      ISSUE_STATE_RESET,
      XHR_ISSUE_STATE
    };
  });
