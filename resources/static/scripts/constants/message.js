/**
 * Message related constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 14, 2017
 */

define("constants/message", function() {
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
    CHAT_SEPARATOR: "ChatSeparator",
    CONVERSATION_REDACTED: "Conversation Redacted",
    // Non Bot messages - end

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
    BOT_ENDED: "Bot Ended",
    /**
     * Bot control messages - end
     */

    /**
     * Bot misc messages - start
     */
    BOT_CANCELLED: "Bot Cancelled"
    /**
     * Bot misc messages - end
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
    TYPE.CHAT_SEPARATOR,
    TYPE.CONVERSATION_REDACTED,
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

    /**
     * @TODO - Add sis type here
     */
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
   * Message body which will be sent in api but not visible on UI
   * Only visible on the dashboard
   */
  const BODY = {
    SOLUTION_ACCEPTED: "Accepted the solution",
    SOLUTION_REJECTED: "Did not accept the solution",
    UNSUPPORTED_INPUT: "Unsupported bot input",
    INTERRUPTED_BY_USER: "chatbot interrupted by user"
  };

  /**
   * Message meta to be sent for unsupported bot type
   */
  const BOT_CANCEL_REASON = {
    UNSUPPORTED_INPUT: "unsupported_bot_input",
    INTERRUPTED_BY_USER: "chatbot_interrupted_by_user"
  };

  const ORIGIN = {
    ADMIN: "admin"
  };

  /**
   * Role of message author
   * The role can be "admin", "chatbot", "user" etc
   */
  const ROLE = {
    CHAT_BOTS: "chatbot"
  };

  const STATE = {
    READ: "read"
  };

  // Types of messages for messageAdd event
  const MESSAGE_ADD_EVENT_TYPES = {
    TEXT: "text",
    ATTACHMENT: "attachment"
  };

  const TEXT_INPUT_MESSAGE_TYPES = [
    TYPE.RESP_EMPTY_MSG_WITH_TEXT_INPUT,
    TYPE.RESP_TEXT_MSG_WITH_TEXT_INPUT,
    TYPE.RESP_TEXT_MSG_WITH_EMAIL_INPUT,
    TYPE.RESP_TEXT_MSG_WITH_NUMERIC_INPUT,
    TYPE.RESP_TEXT_MSG_WITH_DATE_TIME_INPUT,
    TYPE.RESP_TEXT_MSG_WITH_OPTION_INPUT,
    TYPE.RESP_FAQ_LIST_WITH_OPTION_INPUT,
    TYPE.TEXT
  ];

  /**
   * Source of FAQ suggestions
   */
  const FAQ_SUGGESTION_SOURCES = {
    ANSWER_BOT: "ab-ai",
    CUSTOM_BOT: "cb-ai"
  };

  return {
    TYPE,
    ORIGIN,
    ROLE,
    STATE,
    BODY,
    RENDERABLE_MESSAGE_TYPES,
    TEXT_INPUT_MESSAGE_TYPES,
    MESSAGE_ADD_EVENT_TYPES,
    BOT_STEP_MESSAGES,
    BOT_CANCEL_REASON,
    FAQ_SUGGESTION_SOURCES
  };
});
