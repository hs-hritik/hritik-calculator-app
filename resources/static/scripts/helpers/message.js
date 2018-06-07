/**
 * Message related helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 14, 2017
 */

define ("helpers/message",
  [
    "store",
    "constants/message",
    "helpers/common",
    "gunpowder/utils/uuid",
    "gunpowder/utils/date"
  ],
  function (store, messageConstants, commonHelpers, uuidGenerator, dateUtils) {
    "use strict";

    const {
      TYPE: MESSAGE_TYPE,
      RENDERABLE_MESSAGE_TYPES
    } = messageConstants;
    const MSG_ID_PREFIX = "message_";

    /**
     * Return processed message entitiy
     * @param {Object} messages - unprocessed message entitiy
     * @returns {Object} - processed message entitiy
     */
    const getProcessedMessages = (messages) => {
      return messages.map ((msg) => {

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
          author: msg.author,
          isCustomerMsg: (msg.origin !== "admin"),
          attachments: getProcessedAttachments (msg)
        };

        if (msg.chatbot_info) {
          msgObj.chatBotInfo = msg.chatbot_info;
        }

        // If message has faq data, process it
        // FAQ data will be part of bot message
        if (messageType === MESSAGE_TYPE.FAQ_LIST_WITH_OPTION_INPUT) {
          msgObj.suggestedFaqs = msg.faqs.map ((faq) => {
            return {
              id: faq.data.id,
              title: faq.title,
              language: faq.data.language
            };
          });
        }

        return msgObj;
      });
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

      return attachments.map ((attachment) => {
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
     * @param {Object} config.latestMessage - latest message
     * @returns {Object} - prepared xhr data
     */
    const getPreparedMessageDataFromUserInput = (config) => {
      const {
        input: {
          value,
          skipped,
          skipLabel,
          selectedOption
        },
        latestMessage: {
          type: latestMsgType,
          id: messageId,
          chatBotInfo
        },
        isIssue
      } = config;

      const responseMessageType = getUserResponseMessageType (latestMsgType);

      const requestData = {
        refers: messageId
      };

      // @TODO - Change request params after apis are changed.
      // Ideally we should send same request params ('body' and 'type') for issue
      // and preIssue.
      const messageBodyKey = isIssue ? "message-body" : "body";
      const messageTypeKey = isIssue ? "message-type" : "type";

      requestData [messageBodyKey] = value;
      requestData [messageTypeKey] = responseMessageType;

      if (responseMessageType === MESSAGE_TYPE.RESP_FAQ_LIST_WITH_OPTION_INPUT) {
        // If this response is to the answer bot step, web chat sends which
        // FAQs were read (max 10) so far by the end user to the backend. Backend
        // would then pass that information to data plat.
        const readFaqs = store.getState ().chatView.readFaqList;
        if (readFaqs.length) {
          requestData.read_faqs = JSON.stringify (readFaqs.slice (0, 10));
        }
      }

      // In case of bot interrupt, the sequence of messages is
      // 1] Interrupt message (bot/agent) 2] Bot End.
      // Bot end contains empty chat bot info. So checking for non empty
      // chatBotInfo obj.
      if (chatBotInfo && Object.keys (chatBotInfo).length) {
        requestData.chatbot_info = JSON.stringify (chatBotInfo);
      }

      if (skipped) {
        requestData [messageBodyKey] = skipLabel;
        requestData.skipped = skipped;
      } else if (responseMessageType === MESSAGE_TYPE.RESP_TEXT_MSG_WITH_DATE_TIME_INPUT) {
        const date = commonHelpers.getDateObjectFromString (value);
        requestData [messageBodyKey] = dateUtils.format (date, "{dddd}, {mmmm} {dd}, {yyyy}");
        // @TODO - Remove commented meta in request after BE fix
        // requestData.meta = JSON.stringify ({
        //   dt: date.getTime ()
        // });
      } else if (selectedOption && selectedOption.value) {
        requestData [messageBodyKey] = selectedOption.label;
        requestData.option_data = JSON.stringify ({
          option_id: selectedOption.value
        });
      }

      return requestData;
    };

    /**
     * Predicate to return whether message is renderable
     * @param {String} messageType - type of message
     * @returns {Boolean} - whether message is non-renderable
     */
    const isRenderableMessage = (messageType) => {
      return (RENDERABLE_MESSAGE_TYPES.indexOf (messageType) !== -1);
    };

    /**
     * Create custom text message.
     * @param {Object} options - Options to set fields of the message.
     * @param {String} options.body - Body of the message.
     * @param {Boolean} [options.isCustomerMsg] - Agent message or customer message.
     * @returns {Object} - message object.
     */
    const createTextMessage = (options = {}) => {
      const {body, isCustomerMsg = true} = options;

      return {
        id: `${MSG_ID_PREFIX}${uuidGenerator ()}`,
        type: MESSAGE_TYPE.TEXT,
        isSystemMsg: true,
        body,
        createdTs: Date.now (),
        isCustomerMsg
      };
    };

    /**
     * Creates attachment message object
     * @param {Object} option - attachment options
     * @returns {Object} - attachment message object.
     */
    const createAttachmentMessage = (option) => {
      return {
        id: `${MSG_ID_PREFIX}${uuidGenerator ()}`,
        type: MESSAGE_TYPE.ATTACHMENT,
        isCustomerMsg: true,
        isSystemMsg: true,
        createdTs: Date.now (),
        file: option.file,
        states: {
          uploadInProgress: true,
          error: false,
          errorCode: null
        }
      };
    };

    /**
     * Create system info message
     * @param {Object} config - options for system info message
     * @returns {Object} - system info message object
     */
    const createSystemInfoMessage = (config) => {
      return {
        id: `${MSG_ID_PREFIX}${uuidGenerator ()}`,
        type: MESSAGE_TYPE.SYSTEM_INFO,
        isCustomerMsg: false,
        isSystemMsg: true,
        createdTs: Date.now (),
        body: config.body,
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
          return createTextMessage (options);

        case MESSAGE_TYPE.ATTACHMENT:
          return createAttachmentMessage (options);

        case MESSAGE_TYPE.SYSTEM_INFO:
          return createSystemInfoMessage (options);

        default:
          return null;
      }
    };

    return {
      getProcessedMessages,
      getProcessedFaq,
      getPreparedMessageDataFromConfig,
      getPreparedMessageDataFromUserInput,
      createMessage,
      isRenderableMessage
    };
  });
