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
     *    These are normal messages (non bots)
     * 2. Bot
     *    These are bot messages
     *
     * Bot messages are of three types :-
     *  2.1 Bot messages (bot step messages)
     *     When bot engine sends us bot message with input info
     *  2.2 Response to Bot messages (user reply to bot messages)
     *     These types are used for two things
     *     a. When the user sends the reply to bot engine
     *     b. When bot engine sends the user reply back in message list
     *  2.3 Bot control messages
     *     These types are used to take some action like showing TAI, showing
     *     footer etc, but not rendered on the UI
     */
    const TYPE = {
      /**
       * Normal messages - start
       */
      TEXT: "Text",
      // @TODO - Remove faq, csat and end chat type of messages
      FAQ: "Faq",
      CSAT: "Csat",
      END_CHAT: "EndChat",
      ATTACHMENT: "Attachment",
      ACCEPTED: "Confirmation Accepted",
      REJECTED: "Confirmation Rejected",
      // @TODO - Remove system info type of message for conversation history
      SYSTEM_INFO: "SystemInfo",
      /**
       * Normal messages - end
       */

      /**
       * ------- Bot messages - start -------
       */
      TEXT_MSG_WITH_TEXT_INPUT: "Text Message with Text Input",
      TEXT_MSG_WITH_EMAIL_INPUT: "Text Message with Email Input",
      TEXT_MSG_WITH_NUMERIC_INPUT: "Text Message with Numeric Input",
      TEXT_MSG_WITH_DATE_TIME_INPUT: "Text Message with Datetime Input",
      TEXT_MSG_WITH_OPTION_INPUT: "Text Message with Option Input",
      FAQ_LIST_WITH_OPTION_INPUT: "FAQ List with Options Input",
      // This is a special type of message used to wait for first user message.
      // This is not rendered on the UI as it does not have body.
      EMPTY_MSG_WITH_TEXT_INPUT: "Empty Message with Text Input",

      /**
       * User response bot messages - start
       */
      RESP_TEXT_MSG_WITH_TEXT_INPUT: "Text Input Response",
      RESP_TEXT_MSG_WITH_EMAIL_INPUT: "Email Input Response",
      RESP_TEXT_MSG_WITH_NUMERIC_INPUT: "Numeric Input Response",
      RESP_TEXT_MSG_WITH_DATE_TIME_INPUT: "Datetime Input Response",
      RESP_TEXT_MSG_WITH_OPTION_INPUT: "Option Input Response",
      RESP_FAQ_LIST_WITH_OPTION_INPUT: "FAQ Options Response",
      RESP_EMPTY_MSG_WITH_TEXT_INPUT: "Empty Response",
      /**
       * User response bot messages - end
       */

      /**
       * Bot control messages - start
       */
      BOT_STARTED: "Bot Started",
      BOT_ENDED: "Bot Ended"
      /**
       * Bot control messages - end
       */

      /**
       * ------- Bot messages - end -------
       */
    };

    /**
     * Messages which will be displayed on the UI
     */
    const RENDERABLE_MESSAGE_TYPES = [
      TYPE.TEXT,
      TYPE.END_CHAT,
      TYPE.ATTACHMENT,
      TYPE.SYSTEM_INFO,
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
     * Bot step messages
     * These include all bot message except bot control messages :- BOT_STARTED
     * and BOT_ENDED
     * These bot messages are displayed on the UI
     */
    const BOT_STEP_MESSAGES = [
      TYPE.TEXT_MSG_WITH_TEXT_INPUT,
      TYPE.TEXT_MSG_WITH_EMAIL_INPUT,
      TYPE.TEXT_MSG_WITH_NUMERIC_INPUT,
      TYPE.TEXT_MSG_WITH_DATE_TIME_INPUT,
      TYPE.TEXT_MSG_WITH_OPTION_INPUT,
      TYPE.FAQ_LIST_WITH_OPTION_INPUT,
      TYPE.EMPTY_MSG_WITH_TEXT_INPUT,
      TYPE.RESP_TEXT_MSG_WITH_TEXT_INPUT,
      TYPE.RESP_TEXT_MSG_WITH_EMAIL_INPUT,
      TYPE.RESP_TEXT_MSG_WITH_NUMERIC_INPUT,
      TYPE.RESP_TEXT_MSG_WITH_DATE_TIME_INPUT,
      TYPE.RESP_TEXT_MSG_WITH_OPTION_INPUT,
      TYPE.RESP_FAQ_LIST_WITH_OPTION_INPUT,
      TYPE.RESP_EMPTY_MSG_WITH_TEXT_INPUT
    ];

    /**
     * Bot messages
     * These include all the bot messages :- bot step + bot control messages
     */
    const BOT_MESSAGES = BOT_STEP_MESSAGES.concat (TYPE.BOT_STARTED, TYPE.BOT_ENDED);

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
      RENDERABLE_MESSAGE_TYPES,
      BOT_MESSAGES,
      BOT_STEP_MESSAGES
    };
  });
