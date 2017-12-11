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
      INFO_BOT: "INFO_BOT",
      BLOCKED: "BLOCKED",
      CLOSED: "CLOSED"
    };

    const INFO_BOT_FIELDS = {
      NAME: "name",
      EMAIL: "email"
    };

    const MESSAGES_POLLING_TIMEOUT = 3000; // in milliseconds

    return {
      ACTIVE_FOOTER,
      INFO_BOT_FIELDS,
      MESSAGES_POLLING_TIMEOUT
    };
  });
