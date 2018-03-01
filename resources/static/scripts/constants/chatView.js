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
      CLOSED: "CLOSED",
      CSAT: "CSAT",
      CONVERSATION_RESOLUTION_QUESTION: "CONVERSATION_RESOLUTION_QUESTION",
      START_NEW_CONVERSATION: "START_NEW_CONVERSATION",
      SOLUTION_REJECTED: "SOLUTION_REJECTED"
    };

    const INFO_BOT_FIELDS = {
      NAME: "name",
      EMAIL: "email"
    };

    const MESSAGES_POLLING_TIMEOUT = 3000; // in milliseconds
    // @TODO - Below time interval's value is open to discussion
    // 6500 seems too low according to new conditions
    const MESSAGES_FORCE_POLLING_TIMEOUT = 6500;

    return {
      ACTIVE_FOOTER,
      INFO_BOT_FIELDS,
      MESSAGES_POLLING_TIMEOUT,
      MESSAGES_FORCE_POLLING_TIMEOUT
    };
  });
