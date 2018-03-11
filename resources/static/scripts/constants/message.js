/**
 * Message related constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 14, 2017
 */

define ("constants/message",
  function () {
    "use strict";

    const TYPE = {
      TEXT: "Text",
      FAQ: "Faq",
      CSAT: "Csat",
      END_CHAT: "EndChat",
      ATTACHMENT: "Attachment",
      ACCEPTED: "Confirmation Accepted",
      REJECTED: "Confirmation Rejected"
    };

    // Typing timeout (in milliseconds) for different system generated message.
    const TYPING_TIMEOUT = {
      FAQ_SUGGESTIONS_ADDITIONAL_HELP: 1200,
      INFO_BOT_REQUEST: 1200,
      INFO_BOT_FIELD: 1200,
      FAQ_SUGGESTIONS_PROBLEM_SOLVED: 1200
    };

    // Timeout (in milliseconds) for different system generated message.
    const TIMEOUT = {
      FAQ_SUGGESTIONS_ADDITIONAL_HELP: 600
    };

    const ORIGIN = {
      ADMIN: "admin"
    };

    const STATE = {
      READ: "read"
    };

    return {
      TYPE,
      TIMEOUT,
      TYPING_TIMEOUT,
      ORIGIN,
      STATE
    };
  });
