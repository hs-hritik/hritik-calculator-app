/**
 * Chat view helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 16, 2017
 */

define ("helpers/chatView",
  [
    "constants/message",
    "constants/chatView",
    "constants/appState",
    "helpers/common",
    "gunpowder/utils/schema"
  ],
  function (MESSAGE_CONSTANTS, chatViewConstants, appStateConstants,
    commonHelpers, schema) {
    "use strict";

    const {
      TYPE: MESSAGE_TYPE
    } = MESSAGE_CONSTANTS;
    const {
      ISSUE_STATE,
      XHR_ISSUE_STATE
    } = appStateConstants;
    const {
      USER_INPUT_TYPES,
      PICKER_INPUT_THRESHOLD,
      OPTIONS_INPUT_TYPES
    } = chatViewConstants;
    const {Input} = schema;

    /**
     * Return an input type based on the message type. In case of options msg
     * type, the message will have a specific input type.
     * NOTE: For Bots-APIs v1, we are going to use options length as a fallback
     * to determine the input type. In V2, we will start receiving the input type
     * which will be used to determine the input type.
     * @param {String} messageType - message type
     * @param {String} msgInputType - Input type received in message
     * @param {Number} optionsCount - Length of the options list
     * @returns {String} - input type
     */
    const getUserInputType = (messageType, msgInputType, optionsCount) => {
      switch (messageType) {
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
          if (
            msgInputType === OPTIONS_INPUT_TYPES.LIST_PICKER ||
            optionsCount > PICKER_INPUT_THRESHOLD
          ) {
            return USER_INPUT_TYPES.LIST_PICKER;
          }

          return USER_INPUT_TYPES.PILL_SELECT;

        // For message type = 'EMPTY_MSG_WITH_TEXT_INPUT' i.e. first user message
        // the user input type is default input
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
      // @TODO START
      // Remove this dummy data after integration with backend.
      const dummyOptions = [{
        data : {option_id: "id1"},
        title: "Option 1"
      }, {
        data: {option_id: "id2"},
        title: "Option 2"
      }, {
        data: {option_id: "id3"},
        title: "Option 3"
      }, {
        data: {option_id: "id4"},
        title: "Option 4"
      }, {
        data: {option_id: "id5"},
        title: "Option 5"
      }, {
        data: {option_id: "id6"},
        title: "Option 6"
      }, {
        data: {option_id: "id7"},
        title: "Option 7"
      }, {
        data: {option_id: "id8"},
        title: "Option 8"
      }, {
        data: {option_id: "id9"},
        title: "Option 9"
      }, {
        data: {option_id: "id10"},
        title: "Option 10"
      }];
      config.input.options = config.input.options.concat (dummyOptions);
      // @TODO END

      const {
        messageType,
        input: {
          required,
          placeholder,
          label,
          skip_label: skipLabel,
          // NOTE: This won't be available in the Bots-API v1
          type: optionsInputType,
          options
        }
      } = config;
      const userInputType = getUserInputType (
        messageType, optionsInputType, options.length
      );

      const processedInput = {
        type: userInputType,
        required,
        label,
        skipLabel,
        placeholder
      };

      if (
        userInputType === USER_INPUT_TYPES.PILL_SELECT ||
        userInputType === USER_INPUT_TYPES.LIST_PICKER
      ) {
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
            fn: commonHelpers.isNumberValid,
            errorMsg: text.numberValidationError
          });
          break;

        case USER_INPUT_TYPES.DATE:
          validations.push ({
            fn: commonHelpers.isDateValid,
            errorMsg: text.dateValidationError
          });
          break;
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
      getProcessedUserInput,
      getPluralizedIssueType,
      getUserInputValidationConfig,
      getProcessedIssueState
    };
  });
