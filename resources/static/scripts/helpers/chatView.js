/**
 * Chat view helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 16, 2017
 */

define ("helpers/chatView",
  [
    "constants/message",
    "constants/chatView",
    "gunpowder/utils/uuid"
  ],
  function (MESSAGE_CONSTANTS, chatViewConstants, uuidGenerator) {
    "use strict";

    const {
      TYPE: MESSAGE_TYPE,
      NON_RENDERABLE_MESSAGE_TYPES
    } = MESSAGE_CONSTANTS;
    const MSG_ID_PREFIX = "message_";
    const {USER_INPUT_TYPES} = chatViewConstants;

    /**
     * Return an input type
     * @param {String} messageType - message type
     * @returns {String} - input type
     */
    const getUserInputType = (messageType) => {
      switch (messageType) {
        case MESSAGE_TYPE.EMPTY_MSG_WITH_TEXT_INPUT:
        case MESSAGE_TYPE.TEXT_MSG_WITH_TEXT_INPUT:
          return USER_INPUT_TYPES.PLAIN_TEXT;

        case MESSAGE_TYPE.TEXT_MSG_WITH_EMAIL_INPUT:
          return USER_INPUT_TYPES.EMAIL;

        case MESSAGE_TYPE.TEXT_MSG_WITH_NUMERIC_INPUT:
          return USER_INPUT_TYPES.NUMERIC;

        case MESSAGE_TYPE.TEXT_MSG_WITH_DATE_TIME_INPUT:
          return USER_INPUT_TYPES.DATE;

        case MESSAGE_TYPE.TEXT_MSG_WITH_OPTION_INPUT:
        case MESSAGE_TYPE.FAQ_LIST_WITH_OPTION_INPUT:
          return USER_INPUT_TYPES.PILL_SELECT;

        default:
          return USER_INPUT_TYPES.DEFAULT_INPUT;
      }
    };

    /**
     * Return processed input
     * @param {Object} config
     * @param {String} config.messageType - type of message
     * @param {Object} config.input - message input
     * @returns {Object} - processed input object
     */
    const getProcessedUserInput = (config) => {
      const {
        messageType,
        input: {
          required,
          placeholder,
          label,
          skip_label: skipLabel,
          options
        }
      } = config;
      const userInputType = getUserInputType (messageType);

      const processedInput = {
        type: userInputType,
        required,
        label,
        skipLabel,
        placeholder
      };

      if (userInputType === USER_INPUT_TYPES.PILL_SELECT) {
        processedInput.options = options.map ((option) => {
          return {
            label: option.title,
            value: option.data.option_id
          };
        });
      }

      return processedInput;
    };

    /**
     * Predicate to return whether message is non-renderable
     * @param {String} messageType - type of message
     * @returns {Boolean} - whether message is non-renderable
     */
    const isNonRenderableMessage = (messageType) => {
      return (NON_RENDERABLE_MESSAGE_TYPES.indexOf (messageType) !== -1);
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
        file: option.file,
        states: {
          uploadInProgress: true,
          error: false,
          errorCode: null
        }
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
      createMessage,
      getProcessedUserInput,
      isNonRenderableMessage
    };
  });
