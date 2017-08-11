/**
 * App state related constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created July 26, 2017
 */

define ("constants/appState",
  function () {
    "use strict";

    const ISSUE_STATE = {
      PRE_CHAT: "preChat",
      ACTIVE: "active",
      RESOLVED: "resolved",
      REJECTED: "rejected",
      RESOLVED_BY_FAQ_SUGGESTIONS: "resolved_by_faq_suggestions"
    };

    return {
      ISSUE_STATE
    };
  });
