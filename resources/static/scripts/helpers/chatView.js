/**
 * Chat view helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 16, 2017
 */

define ("helpers/chatView",
  [
    "store",
    "constants/message",
    "constants/chatView",
    "constants/appState",
    "helpers/common",
    "gunpowder/utils/uuid",
    "gunpowder/utils/schema",
    "gunpowder/utils/validation"
  ],
  function (store, MESSAGE_CONSTANTS, chatViewConstants, appStateConstants,
    commonHelpers, uuidGenerator, schema, validationsUtil) {
    "use strict";

    const {
      TYPE: MESSAGE_TYPE,
      RENDERABLE_MESSAGE_TYPES
    } = MESSAGE_CONSTANTS;
    const {
      ISSUE_STATE,
      XHR_ISSUE_STATE
    } = appStateConstants;
    const MSG_ID_PREFIX = "message_";
    const {USER_INPUT_TYPES} = chatViewConstants;
    const {Input} = schema;

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

        case MESSAGE_TYPE.FAQ:
          return createFaqMessage (options);

        case MESSAGE_TYPE.CSAT:
          return createCsatMessage ();

        case MESSAGE_TYPE.END_CHAT:
          return createEndChatMessage ();

        case MESSAGE_TYPE.ATTACHMENT:
          return createAttachmentMessage (options);

        case MESSAGE_TYPE.SYSTEM_INFO:
          return createSystemInfoMessage (options);

        default:
          return null;
      }
    };

    /**
     * Return validation config for given user input
     * Validation config will be object containing error and error message
     * @param {Object} userInput - user input object
     * @param {Object} text - text object containing validation strings
     * @returns {Object} - validation config
     */
    const getUserInputValidationConfig = (userInput, text) => {
      const {value, type, required} = userInput;
      const validations = [];

      // Skip required validation for input type pill select
      if (required && type !== USER_INPUT_TYPES.PILL_SELECT) {
        validations.push ("required");
      }

      // @NOTE - We are passing object in validation just to have custom error messages
      // We do not want the default error message strings returned by Input.
      switch (type) {
        case USER_INPUT_TYPES.EMAIL:
          validations.push ({
            fn: (val) => {
              return !!val && commonHelpers.isEmailValid (val.trim ());
            },
            errorMsg: text.emailValidationError
          });
          break;

        case USER_INPUT_TYPES.NUMERIC:
          validations.push ({
            fn: (val) => {
              return validationsUtil.number (val);
            },
            errorMsg: text.numberValidationError
          });
          break;

        case USER_INPUT_TYPES.DATE:
          validations.push ({
            fn: (dateValue) => {
              // @TODO - Following code is sample date validation copied from SO
              // Change if needed
              if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test (dateValue)) {
                return false;
              }

              // Parse the date parts to integers
              const parts = dateValue.split ("/");
              const day = parseInt (parts[0], 10);
              const month = parseInt (parts[1], 10);
              const year = parseInt (parts[2], 10);

              // Check the ranges of month and year
              if (year < 1000 || year > 3000 || month === 0 || month > 12) {
                return false;
              }

              const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

              // Adjust for leap years
              if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
                monthLength[1] = 29;
              }

              // Check the range of the day
              return (day > 0 && day <= monthLength[month - 1]);
            },
            errorMsg: text.dateValidationError
          });
      }

      const input = new Input ({
        value,
        validations
      });

      return {
        errorMsg: input.isValid ()
      };
    };

    /**
     * Return prepared message data for xhr
     * @param {Object} config - config object
     * @param {Object} config.input - user input object
     * @param {String} config.message - message object
     */
    const getPreparedMessageData = (config) => {
      const {
        input: {
          value,
          skipped,
          skipLabel,
          selectedOption
        },
        message: {
          type: messageType,
          id: messageId,
          chatBotInfo
        }
      } = config;

      const responseMessageType = getUserResponseMessageType (messageType);

      const requestData = {
        body: value,
        refers: messageId,
        type: responseMessageType
      };

      if (responseMessageType === MESSAGE_TYPE.RESP_FAQ_LIST_WITH_OPTION_INPUT) {
        // If this response is to the answer bot step, web chat sends which
        // FAQs were read so far by the end user to the backend. Backend would
        // then pass that information to data plat.
        const readFaqs = store.getState ().chatView.readFaqList;
        if (readFaqs.length) {
          requestData.read_faqs = JSON.stringify (readFaqs);
        }
      }

      if (chatBotInfo) {
        requestData.chatbot_info = JSON.stringify (chatBotInfo);
      }

      if (skipped) {
        requestData.body = skipLabel;
        requestData.skipped = skipped;
      }

      if (selectedOption && selectedOption.value) {
        requestData.body = selectedOption.label;
        requestData.option_data = JSON.stringify ({
          option_id: selectedOption.value
        });
      }

      return requestData;
    };

    /**
     * Return pluralize issue type
     * The issue type we save in our store is singular example :- 'issue' or 'preissue'
     * The above mentioned issue type is received in backend response
     * But for api calls and saving message cursors we require plural value :- 'issues'
     * or 'preissues' as we need to send back this info to backend
     * @param {String} issueType
     * @returns {String} - pluralized issue type string
     */
    const getPluralizedIssueType = (issueType) => {
      return issueType + "s";
    };

    /**
     * Return processed issue state for given xhr response state
     * @param {String} xhrIssueState - xhr issue state
     */
    const getProcessedIssueState = (xhrIssueState) => {
      switch (xhrIssueState) {
        case XHR_ISSUE_STATE.ISSUE.RESOLVED:
        case XHR_ISSUE_STATE.PRE_ISSUE.RESOLVED:
          return ISSUE_STATE.RESOLVED;

        case XHR_ISSUE_STATE.ISSUE.REJECTED:
        case XHR_ISSUE_STATE.PRE_ISSUE.REJECTED:
          return ISSUE_STATE.REJECTED;

        default:
          return ISSUE_STATE.ACTIVE;
      }
    };

    return {
      createMessage,
      getProcessedUserInput,
      isRenderableMessage,
      getPluralizedIssueType,
      getUserInputValidationConfig,
      getPreparedMessageData,
      getProcessedIssueState
    };
  });
