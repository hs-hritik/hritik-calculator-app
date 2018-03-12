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
      TEXT_MSG_WITH_TEXT_INPUT: "txt_msg_with_txt_input",
      TEXT_MSG_WITH_EMAIL_INPUT: "txt_msg_with_email_input",
      TEXT_MSG_WITH_NUMERIC_INPUT: "txt_msg_with_numeric_input",
      TEXT_MSG_WITH_DATE_TIME_INPUT: "txt_msg_with_dt_input",
      TEXT_MSG_WITH_OPTION_INPUT: "txt_msg_with_option_input",
      FAQ_LIST_WITH_OPTION_INPUT: "faq_list_msg_with_option_input",
      EMPTY_MSG_WITH_TEXT_INPUT: "empty_msg_with_txt_input",
      BOT_STARTED: "bot_started",
      BOT_ENDED: "bot_ended"
    };

    const NON_RENDERABLE_MESSAGE_TYPES = [
      TYPE.BOT_STARTED,
      TYPE.BOT_ENDED
    ];

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
      NON_RENDERABLE_MESSAGE_TYPES
    };
  });
