/**
 * Chat view helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 16, 2017
 */

define ("helpers/chatView",
  [
    "constants/message",
    "gunpowder/utils/uuid"
  ],
  function (MESSAGE_CONSTANTS, uuidGenerator) {
    "use strict";

    const MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE;
    const MSG_ID_PREFIX = "message_";

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
     * Create FAQ message object.
     * @param {Object} options - Options to set fields of the message.
     * @param {Array} options.faqs - array of faq objects (id and title).
     * @returns {Object} - faq message object.
     */
    const createFaqMessage = (options = {}) => {
      const {faqs = []} = options;

      return {
        id: `${MSG_ID_PREFIX}${uuidGenerator ()}`,
        type: MESSAGE_TYPE.FAQ,
        isSystemMsg: true,
        isCustomerMsg: false,
        createdTs: Date.now (),
        suggestedFaqs: faqs.slice (0, 3)
      };
    };

    /**
     * Create csat message object.
     * @returns {Object} - csat message object.
     */
    const createCsatMessage = () => {
      return {
        id: `${MSG_ID_PREFIX}${uuidGenerator ()}`,
        type: MESSAGE_TYPE.CSAT,
        isSystemMsg: true,
        isCustomerMsg: false,
        createdTs: Date.now ()
      };
    };

    /**
     * Create end chat message object.
     * @returns {Object} - end chat message object.
     */
    const createEndChatMessage = () => {
      return {
        id: `${MSG_ID_PREFIX}${uuidGenerator ()}`,
        type: MESSAGE_TYPE.END_CHAT,
        isSystemMsg: true,
        isCustomerMsg: false,
        createdTs: Date.now ()
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
        file: option.file
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

        case MESSAGE_TYPE.FAQ:
          return createFaqMessage (options);

        case MESSAGE_TYPE.CSAT:
          return createCsatMessage ();

        case MESSAGE_TYPE.END_CHAT:
          return createEndChatMessage ();

        case MESSAGE_TYPE.ATTACHMENT:
          return createAttachmentMessage (options);

        default:
          return null;
      }
    };

    return {
      createMessage
    };
  });
