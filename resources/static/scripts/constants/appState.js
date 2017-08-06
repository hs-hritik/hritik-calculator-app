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
      RESOVLED: "resovled",
      REJECTED: "rejected",
      RESOLVED_BY_FAQ_SUGGESTIONS: "RESOLVED_BY_FAQ_SUGGESTIONS"
    };

    return {
      ISSUE_STATE
    };
  });
