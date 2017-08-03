/**
 * Chat view related constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 14, 2017
 */

define ("constants/chatView",
  function () {
    "use strict";

    const ACTIVE_FOOTER = {
      REPLY: "REPLY",
      FAQ_SUGGESTIONS_FEEDBACK: "FAQ_SUGGESTIONS_FEEDBACK",
      ISSUE_FEEDBACK: "ISSUE_FEEDBACK",
      CSAT: "CSAT",
      NEW_CONVERSATION: "NEW_CONVERSATION",
      INFO_BOT: "INFO_BOT",
      BLOCKED: "BLOCKED",
      CLOSED: "CLOSED"
    };

    const MESSAGES_POLLING_TIMEOUT = 3000; // in milliseconds

    return {
      ACTIVE_FOOTER,
      MESSAGES_POLLING_TIMEOUT
    };
  });
