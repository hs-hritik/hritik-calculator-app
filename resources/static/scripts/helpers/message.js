/**
 * Message related helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 14, 2017
 */

define("helpers/message", [
  "store",
  "constants/message",
  "helpers/common",
  "gunpowder/utils/uuid",
  "gunpowder/utils/date"
], function(store, messageConstants, commonHelpers, uuidGenerator, dateUtils) {
  "use strict";

  const {
    TYPE: MESSAGE_TYPE,
    RENDERABLE_MESSAGE_TYPES,
    ORIGIN: MESSAGE_ORIGIN,
    ROLE: MESSAGE_AUTHOR_ROLE,
    BOT_STEP_MESSAGES,
    BODY: MESSAGE_BODY,
    BOT_CANCEL_REASON
  } = messageConstants;
  const MSG_ID_PREFIX = "message_";

  const SECONDS = 60;
  const MILLISECONDS = 1000;

  // Create an array of values present in message type
  const MESSAGE_TYPE_LIST = Object.keys(MESSAGE_TYPE).map((key) => {
    return MESSAGE_TYPE[key];
  });

  /**
   * Return processed message
   * @param {Object} message - unprocessed message
   * @returns {Object} - processed message
   */
  const getProcessedMessage = (msg) => {
    if (msg.processed) {
      return msg;
    }

    const {type: messageType} = msg;

    const msgObj = {
      id: msg.id,
      type: msg.type,
      body: msg.body,
      state: msg.state,
      states: {}, // Applicable only in case of attachments
      createdTs: msg.created_at,
      redacted: msg.redacted,
      author: msg.author,
      isCustomerMsg: msg.origin !== MESSAGE_ORIGIN.ADMIN,
      attachments: getProcessedAttachments(msg)
    };

    if (msg.chatbot_info) {
      msgObj.chatBotInfo = msg.chatbot_info;
    }

    // If message has faq data, process it
    // FAQ data will be part of bot message
    if (messageType === MESSAGE_TYPE.FAQ_LIST_WITH_OPTION_INPUT) {
      msgObj.suggestedFaqs = msg.faqs.map((faq) => {
        return {
          id: faq.data.id,
          title: faq.title,
          language: faq.data.language
        };
      });
      msgObj.faqSource = msg.faq_source;
    }

    if (messageType === MESSAGE_TYPE.SIS) {
      msgObj.intentLabels = msg.intent_labels;
    }

    return msgObj;
  };

  /**
   * Return processed messages
   * @param {Object} messages - unprocessed messages
   * @returns {Array} - processed messages
   */
  const getProcessedMessages = (messages) => {
    return messages.map(getProcessedMessage);
  };

  /**
   * Returns processed attachment.
   * @param {Array} attachments - unprocessed message attachment.
   * @returns {Array} - processed attachments.
   */
  // @TODO :- Remove 'msg' param after BE fix, 'attachments' will be the
  // original parameter
  const getProcessedAttachments = (msg) => {
    // @TODO :- Remove array of attachment after BE fix
    const attachments = msg.attachments || (msg.attachment && [msg.attachment]);

    if (!attachments) {
      return null;
    }

    return attachments.map((attachment) => {
      return {
        url: attachment.url,
        contentType: attachment.content_type,
        fileName: attachment.file_name
      };
    });
  };

  /**
   * Return processed faq entity.
   * @param {Object} faq - unprocessed faq entitiy
   * @param {string} language
   * @returns {Object} - processed faq entitiy
   */
  const getProcessedFaq = (faq, language) => {
    return {
      id: faq.id,
      translations: faq.translations,
      language
    };
  };

  /**
   * Return user response message type
   * @param {String} msgType - message type
   * @returns {String} - Type of request message
   */
  const getUserResponseMessageType = (msgType) => {
    switch (msgType) {
      case MESSAGE_TYPE.TEXT_MSG_WITH_TEXT_INPUT:
        return MESSAGE_TYPE.RESP_TEXT_MSG_WITH_TEXT_INPUT;

      case MESSAGE_TYPE.TEXT_MSG_WITH_EMAIL_INPUT:
        return MESSAGE_TYPE.RESP_TEXT_MSG_WITH_EMAIL_INPUT;

      case MESSAGE_TYPE.TEXT_MSG_WITH_NUMERIC_INPUT:
        return MESSAGE_TYPE.RESP_TEXT_MSG_WITH_NUMERIC_INPUT;

      case MESSAGE_TYPE.TEXT_MSG_WITH_DATE_TIME_INPUT:
        return MESSAGE_TYPE.RESP_TEXT_MSG_WITH_DATE_TIME_INPUT;

      case MESSAGE_TYPE.TEXT_MSG_WITH_OPTION_INPUT:
        return MESSAGE_TYPE.RESP_TEXT_MSG_WITH_OPTION_INPUT;

      case MESSAGE_TYPE.FAQ_LIST_WITH_OPTION_INPUT:
        return MESSAGE_TYPE.RESP_FAQ_LIST_WITH_OPTION_INPUT;

      case MESSAGE_TYPE.EMPTY_MSG_WITH_TEXT_INPUT:
        return MESSAGE_TYPE.RESP_EMPTY_MSG_WITH_TEXT_INPUT;

      default:
        return MESSAGE_TYPE.TEXT;
    }
  };

  /**
   * Return prepared message xhr data from config
   * @param {Object} config
   * @param {String} config.msgBody - message body
   * @param {String} config.msgType - message type
   * @returns {Object} - prepared xhr data
   */
  const getPreparedMessageDataFromConfig = (config) => {
    const {msgType, msgBody} = config;

    // @NOTE - Currently config messages will be added only when issue is created.
    // So we are not adding a check for preIssue.
    // Also this will be modified/removed when apis are changes to support
    // 'body' and 'type'.
    return {
      "message-body": msgBody,
      "message-type": msgType
    };
  };

  /**
   * Return prepared message xhr data from user input
   * @param {Object} config
   * @param {Object} config.input - user input
   * @param {String} config.latestMessage - latest message
   * @param {Boolean} config.isIssue - issue type is issue
   * @param {Boolean} config.botStepInProgress - Whether bot is in progress currently
   * @returns {Object} - prepared xhr data
   */
  const getPreparedMessageDataFromUserInput = (config) => {
    const {
      input: {value, skipped, skipLabel, selectedOption},
      latestMessage: {type: latestMsgType, id: messageId, chatBotInfo},
      isIssue,
      botStepInProgress
    } = config;

    const responseMessageType = getUserResponseMessageType(latestMsgType);

    const requestData = {
      refers: messageId
    };

    // @TODO - Change request params after apis are changed.
    // Ideally we should send same request params ('body' and 'type') for issue
    // and preIssue.
    const messageBodyKey = isIssue ? "message-body" : "body";
    const messageTypeKey = isIssue ? "message-type" : "type";

    requestData[messageBodyKey] = value;
    requestData[messageTypeKey] = responseMessageType;

    if (responseMessageType === MESSAGE_TYPE.RESP_FAQ_LIST_WITH_OPTION_INPUT) {
      // If this response is to the answer bot step, web chat sends which
      // FAQs were read (max 10) so far by the end user to the backend. Backend
      // would then pass that information to data plat.
      // @TODO: Store the max faqs to be sent (10) in a constant
      const readFaqs = store.getState().chatView.readFaqList;
      if (readFaqs.length) {
        requestData.read_faqs = JSON.stringify(readFaqs.slice(0, 10));
      }
    }

    // In case of bot interrupt, the sequence of messages is
    // 1] Interrupt message (bot/agent) 2] Bot End.
    // Bot end contains empty chat bot info. So checking for non empty
    // chatBotInfo obj.
    if (botStepInProgress && chatBotInfo && Object.keys(chatBotInfo).length) {
      requestData.chatbot_info = JSON.stringify(chatBotInfo);
    }

    if (skipped) {
      requestData[messageBodyKey] = skipLabel;
      requestData.skipped = skipped;
    } else if (responseMessageType === MESSAGE_TYPE.RESP_TEXT_MSG_WITH_DATE_TIME_INPUT) {
      const date = commonHelpers.getDateObjectFromString(value);
      requestData[messageBodyKey] = dateUtils.format(date, "{dddd}, {mmmm} {dd}, {yyyy}");
      requestData.meta = JSON.stringify({
        dt: date.getTime(),
        // @Note :- We are multiplying by -1, because getTimezoneOffset method
        // returns a value in mins from local time to UTC. We need the time
        // difference from UTC to local time.
        // Ref :- MDN - Date.getTimezoneOffset
        tz_offset: date.getTimezoneOffset() * SECONDS * MILLISECONDS * -1
      });
    } else if (selectedOption && selectedOption.value) {
      requestData[messageBodyKey] = selectedOption.label;
      requestData.option_data = JSON.stringify({
        option_id: selectedOption.value
      });
    }

    return requestData;
  };

  /**
   * Return prepared message xhr data for unsupported bot message
   * @param {Object} config
   * @param {Object} config.latestMessage - latest message
   * @param {Object} config.isIssue - issue type is issue
   * @returns {Object} - prepared xhr data
   */
  const getPreparedMessageDataForUnsupportedBotMessage = (config) => {
    const {
      isIssue,
      latestMessage: {id, chatBotInfo}
    } = config;
    const requestData = {};

    const messageBodyKey = isIssue ? "message-body" : "body";
    const messageTypeKey = isIssue ? "message-type" : "type";

    requestData[messageTypeKey] = MESSAGE_TYPE.BOT_CANCELLED;
    requestData[messageBodyKey] = MESSAGE_BODY.UNSUPPORTED_INPUT;
    requestData.chatbot_cancelled_reason = BOT_CANCEL_REASON.UNSUPPORTED_INPUT;
    requestData.refers = id;

    if (chatBotInfo && Object.keys(chatBotInfo).length) {
      requestData.chatbot_info = JSON.stringify(chatBotInfo);
    }

    return requestData;
  };

  /**
   * Predicate to return whether message is renderable
   * @param {String} messageType - type of message
   * @returns {Boolean} - whether message is non-renderable
   */
  const isRenderableMessage = (messageType) => {
    return RENDERABLE_MESSAGE_TYPES.indexOf(messageType) !== -1;
  };

  /**
   * Create custom text message.
   * @param {Object} options - Options to set fields of the message.
   * @param {String} options.body - Body of the message.
   * @param {Boolean} [options.isCustomerMsg] - Agent message or customer message.
   * @param {Boolean} [options.isGreetingMessage]
   * @returns {Object} - message object.
   */
  const createTextMessage = (options = {}) => {
    const {body, isCustomerMsg = true, isGreetingMessage = false} = options;

    return {
      id: `${MSG_ID_PREFIX}${uuidGenerator()}`,
      type: MESSAGE_TYPE.TEXT,
      isSystemMsg: true,
      body,
      createdTs: Date.now(),
      isCustomerMsg,
      isGreetingMessage
    };
  };

  /**
   * Creates attachment message object
   * @param {Object} option - attachment options
   * @returns {Object} - attachment message object.
   */
  const createAttachmentMessage = (option) => {
    return {
      id: `${MSG_ID_PREFIX}${uuidGenerator()}`,
      type: MESSAGE_TYPE.ATTACHMENT,
      isCustomerMsg: true,
      isSystemMsg: true,
      createdTs: Date.now(),
      file: option.file,
      states: {
        uploadInProgress: true,
        error: false,
        errorCode: null
      }
    };
  };

  /**
   * Create separator message
   * @param {Object} config - options for separator message
   * @param {Boolean} config.hr - options for separator message
   * @param {String} config.timestamp - timestamp string
   * @param {String} config.infoText - string to show above hr
   * @returns {Object} - separator message object
   */
  const createSeparatorMessage = (config) => {
    return {
      id: `${MSG_ID_PREFIX}${uuidGenerator()}`,
      type: MESSAGE_TYPE.CHAT_SEPARATOR,
      isCustomerMsg: false,
      isSystemMsg: true,
      createdTs: Date.now(),
      body: "",
      timestamp: config.timestamp,
      hr: config.hr,
      infoText: config.infoText,
      processed: true
    };
  };

  /**
   * Create conversation redacted message
   * @param {Object} config - options for separator message
   * @param {Boolean} config.redactionCount - how many conversations were redacted.
   * @returns {Object} - conversation redacted message
   */
  const createRedactionMessage = (config) => {
    return {
      id: `${MSG_ID_PREFIX}${uuidGenerator()}`,
      type: MESSAGE_TYPE.CONVERSATION_REDACTED,
      isCustomerMsg: false,
      isSystemMsg: true,
      createdTs: Date.now(),
      body: "",
      redactionCount: config.redactionCount,
      processed: true
    };
  };

  /**
   * Create message of given type.
   * @param {String} type - Message type.
   * @param {Object} options - Message options.
   */
  const createMessage = (type, options) => {
    switch (type) {
      case MESSAGE_TYPE.TEXT:
        return createTextMessage(options);

      case MESSAGE_TYPE.ATTACHMENT:
        return createAttachmentMessage(options);

      case MESSAGE_TYPE.CHAT_SEPARATOR:
        return createSeparatorMessage(options);

      case MESSAGE_TYPE.CONVERSATION_REDACTED:
        return createRedactionMessage(options);

      default:
        return null;
    }
  };

  /**
   * Predicate to return whether message is of type bot
   * @param {Object} msg - message
   * @returns {Boolean} - whether given message type is bot message
   */
  const isBotMessage = (msg) => {
    const {
      author: {roles}
    } = msg;

    // We determine bot message using message's author role. So we have
    // assurity that the given message is a bot message whether we support it
    // or not.
    if (!Array.isArray(roles)) {
      return false;
    }

    return roles.indexOf(MESSAGE_AUTHOR_ROLE.CHAT_BOTS) !== -1;
  };

  /**
   * Predicate to return whether message is of type bot step
   * @param {String} msgType - type of message
   * @returns {Boolean} - whether given message type is bot step
   */
  const isBotStepMessage = (msgType) => {
    return BOT_STEP_MESSAGES.indexOf(msgType) !== -1;
  };

  /**
   * Predicate to return whether message type is supported
   * @param {String} msgType - type of message
   * @returns {Boolean} - whether given message type is supported
   */
  const isMessageTypeSupported = (msgType) => {
    return MESSAGE_TYPE_LIST.indexOf(msgType) !== -1;
  };

  return {
    getProcessedMessage,
    getProcessedMessages,
    getProcessedFaq,
    getPreparedMessageDataFromConfig,
    getPreparedMessageDataFromUserInput,
    getPreparedMessageDataForUnsupportedBotMessage,
    createMessage,
    isRenderableMessage,
    isBotMessage,
    isBotStepMessage,
    isMessageTypeSupported
  };
});
