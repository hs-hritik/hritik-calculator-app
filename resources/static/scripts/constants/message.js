/**
 * Message related constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 14, 2017
 */

define ("constants/message",
  function () {
    "use strict";

    /**
     * There are two highlevel types of message
     * 1. Normal
     *    These are normal existing messages (before bots)
     * 2. Bot
     *    These are bot messages
     *
     * Bot messages are of three types :-
     * 1] Bot messages (bot step messages)
     *    When bot engine sends us bot message with input info
     * 2] Response to Bot messages (user reply to bot messages)
     *    These types are used for two things
     *    a. When the user sends the reply to bot engine
     *    b. When bot engine sends the user reply back in message list
     * 3] Bot control messages
     *    These types are used to take some action like showing TAI, showing
     *    footer etc, but not rendered on the UI
     */
    const TYPE = {
      // Non Bot messages - start
      TEXT: "Text",
      FAQ: "Faq",
      CSAT: "Csat",
      END_CHAT: "EndChat",
      ATTACHMENT: "Attachment",
      ACCEPTED: "Confirmation Accepted",
      REJECTED: "Confirmation Rejected",
      CHAT_SEPARATOR: "ChatSeparator",
      // Non Bot messages - end

      // Bot messages - start
      TEXT_MSG_WITH_TEXT_INPUT: "Text Message with Text Input",
      TEXT_MSG_WITH_EMAIL_INPUT: "Text Message with Email Input",
      TEXT_MSG_WITH_NUMERIC_INPUT: "Text Message with Numeric Input",
      TEXT_MSG_WITH_DATE_TIME_INPUT: "Text Message with Datetime Input",
      TEXT_MSG_WITH_OPTION_INPUT: "Text Message with Option Input",
      FAQ_LIST_WITH_OPTION_INPUT: "FAQ List with Options Input",
      /**
       * EMPTY_MSG_WITH_TEXT_INPUT is a special type of message used to wait for
       * first user message. This is not rendered on the UI.
       */
      EMPTY_MSG_WITH_TEXT_INPUT: "Empty Message with Text Input",
      // Bot messages - end

      // Response bot messages - start
      RESP_TEXT_MSG_WITH_TEXT_INPUT: "Text Input Response",
      RESP_TEXT_MSG_WITH_EMAIL_INPUT: "Email Input Response",
      RESP_TEXT_MSG_WITH_NUMERIC_INPUT: "Numeric Input Response",
      RESP_TEXT_MSG_WITH_DATE_TIME_INPUT: "Datetime Input Response",
      RESP_TEXT_MSG_WITH_OPTION_INPUT: "Option Input Response",
      RESP_FAQ_LIST_WITH_OPTION_INPUT: "FAQ Options Response",
      /**
       * RESP_EMPTY_MSG_WITH_TEXT_INPUT is the type used for first user message
       */
      RESP_EMPTY_MSG_WITH_TEXT_INPUT: "Empty Response",
      // Response bot messages - end

      // Bot control messages - start
      BOT_STARTED: "Bot Started",
      BOT_ENDED: "Bot Ended"
      // Bot control messages - end
    };

    const RENDERABLE_MESSAGE_TYPES = [
      TYPE.TEXT,
      TYPE.END_CHAT,
      TYPE.ATTACHMENT,
      TYPE.CHAT_SEPARATOR,
      TYPE.TEXT_MSG_WITH_TEXT_INPUT,
      TYPE.TEXT_MSG_WITH_EMAIL_INPUT,
      TYPE.TEXT_MSG_WITH_NUMERIC_INPUT,
      TYPE.TEXT_MSG_WITH_DATE_TIME_INPUT,
      TYPE.TEXT_MSG_WITH_OPTION_INPUT,
      TYPE.FAQ_LIST_WITH_OPTION_INPUT,
      TYPE.RESP_TEXT_MSG_WITH_TEXT_INPUT,
      TYPE.RESP_TEXT_MSG_WITH_EMAIL_INPUT,
      TYPE.RESP_TEXT_MSG_WITH_NUMERIC_INPUT,
      TYPE.RESP_TEXT_MSG_WITH_DATE_TIME_INPUT,
      TYPE.RESP_TEXT_MSG_WITH_OPTION_INPUT,
      TYPE.RESP_FAQ_LIST_WITH_OPTION_INPUT,
      TYPE.RESP_EMPTY_MSG_WITH_TEXT_INPUT
    ];

    /**
     * Message body which will be sent in api but not visible on UI
     * Only visible on the dashboard
     */
    const BODY = {
      SOLUTION_ACCEPTED: "Accepted the solution",
      SOLUTION_REJECTED: "Did not accept the solution"
    };

    const ORIGIN = {
      ADMIN: "admin"
    };

    const STATE = {
      READ: "read"
    };

    return {
      TYPE,
      ORIGIN,
      STATE,
      BODY,
      RENDERABLE_MESSAGE_TYPES
    };
  });
