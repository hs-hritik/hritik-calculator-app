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
      REJECTED: "rejected"
    };

    return {
      ISSUE_STATE
    };
  });
