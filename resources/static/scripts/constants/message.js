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
      REJECTED: "Confirmation Rejected",
      TEXT_MSG_WITH_TEXT_INPUT: "Text Message with Text Input",
      TEXT_MSG_WITH_EMAIL_INPUT: "Text Message with Email Input",
      TEXT_MSG_WITH_NUMERIC_INPUT: "Text Message with Numeric Input",
      TEXT_MSG_WITH_DATE_TIME_INPUT: "Text Message with Datetime Input",
      TEXT_MSG_WITH_OPTION_INPUT: "Text Message with Option Input",
      FAQ_LIST_WITH_OPTION_INPUT: "FAQ List with Options Input",
      EMPTY_MSG_WITH_TEXT_INPUT: "Empty Message with Text Input",
      BOT_STARTED: "bot_started",
      BOT_ENDED: "bot_ended"
    };

    const USER_RESPONSE_TYPES = {
      RESP_TEXT_MSG_WITH_TEXT_INPUT: "Text Input Response",
      RESP_TEXT_MSG_WITH_EMAIL_INPUT: "Email Input Response",
      RESP_TEXT_MSG_WITH_NUMERIC_INPUT: "Numeric Input Response",
      RESP_TEXT_MSG_WITH_DATE_TIME_INPUT: "Datetime Input Response",
      RESP_TEXT_MSG_WITH_OPTION_INPUT: "Option Input Response",
      RESP_FAQ_LIST_WITH_OPTION_INPUT: "FAQ Options Response",
      RESP_EMPTY_MSG_WITH_TEXT_INPUT: "Empty Response"
    };

    const RENDERABLE_MESSAGE_TYPES = [
      TYPE.TEXT,
      TYPE.END_CHAT,
      TYPE.ATTACHMENT,
      TYPE.TEXT_MSG_WITH_TEXT_INPUT,
      TYPE.TEXT_MSG_WITH_EMAIL_INPUT,
      TYPE.TEXT_MSG_WITH_NUMERIC_INPUT,
      TYPE.TEXT_MSG_WITH_DATE_TIME_INPUT,
      TYPE.TEXT_MSG_WITH_OPTION_INPUT,
      TYPE.FAQ_LIST_WITH_OPTION_INPUT
    ];

    /**
     * Message body which will be sent in api but not visible on UI
     * Only visible on the dashboard
     */
    const BODY = {
      SOLUTION_ACCEPTED: "Accepted the solution",
      SOLUTION_REJECTED: "Did not accept the solution"
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
      STATE,
      BODY,
      RENDERABLE_MESSAGE_TYPES,
      USER_RESPONSE_TYPES
    };
  });
