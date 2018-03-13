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

    /**
     * Input types are used to render footer
     * Depending on the type, the footer components will be rendered,
     * validations will be added etc.
     */
    // @TODO - Rename INPUT_TYPES to USER_INPUT_TYPES
    const INPUT_TYPES = {
      // Default input type is used to render reply box component
      DEFAULT_INPUT: "DEFAULT_INPUT",
      // Rest of the input types below are bot input types, used to render bot
      // input in footer.
      PLAIN_TEXT: "PLAIN_TEXT",
      EMAIL: "EMAIL",
      NUMERIC: "NUMERIC",
      DATE: "DATE",
      PILL_SELECT: "PILL_SELECT"
    };

    const HTML_INPUT_TYPES = {
      EMAIL: "email",
      NUMERIC: "number",
      DATE: "date",
      PLAIN_TEXT: "text"
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
      MESSAGES_FORCE_POLLING_TIMEOUT,
      INPUT_TYPES,
      HTML_INPUT_TYPES
    };
  });
