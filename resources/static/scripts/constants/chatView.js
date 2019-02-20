/**
 * Chat view related constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 14, 2017
 */

define (
  "constants/chatView",
  [
    "gunpowder/constants/widgets/picker"
  ],
  function (LIST_PICKER_CONSTANTS) {
    "use strict";

    const {
      TOGGLE_STATES: LIST_PICKER_TOGGLE_STATES
    } = LIST_PICKER_CONSTANTS;

    const ACTIVE_FOOTER = {
      REPLY: "REPLY",
      FAQ_SUGGESTIONS_FEEDBACK: "FAQ_SUGGESTIONS_FEEDBACK",
      CLOSED: "CLOSED",
      CSAT: "CSAT",
      CONVERSATION_RESOLUTION_QUESTION: "CONVERSATION_RESOLUTION_QUESTION",
      START_NEW_CONVERSATION: "START_NEW_CONVERSATION",
      SOLUTION_REJECTED: "SOLUTION_REJECTED"
    };

    /**
     * Input types are used to render footer
     * Depending on the type, the footer components will be rendered,
     * validations will be added etc.
     */
    const USER_INPUT_TYPES = {
      // Default input type is used to render reply box component
      DEFAULT_INPUT: "DEFAULT_INPUT",
      // Rest of the input types below are bot input types, used to render bot
      // input in footer.
      PLAIN_TEXT: "PLAIN_TEXT",
      EMAIL: "EMAIL",
      NUMERIC: "NUMERIC",
      DATE: "DATE",
      PILL_SELECT: "PILL_SELECT",
      LIST_PICKER: "LIST_PICKER"
    };

    const HTML_INPUT_TYPES = {
      EMAIL: "email",
      NUMERIC: "number",
      DATE: "date",
      PLAIN_TEXT: "text"
    };

    const CURSOR_TYPES = {
      FORWARD: "forward",
      BACKWARD: "backward"
    };

    const OPTIONS_INPUT_TYPES = {
      PILLS: "option_pills",
      LIST_PICKER: "list_picker"
    };

    const MESSAGES_POLLING_TIMEOUT = 3000; // in milliseconds
    // @TODO - Below time interval's value is open to discussion
    // 6500 seems too low according to new conditions
    const MESSAGES_FORCE_POLLING_TIMEOUT = 6500;

    // The number of failures after which we assume that there is some problem with the poller.
    const MAX_POLLER_FAILURES_ALLOWED = 2;

    const USER_REDACTION_ERR_MSG = "User Not Found";
    const USER_REDACTION_ERR_STATUS_CODE = 404;

    const DEFAULT_LIST_PICKER_TOGGLE_STATE = LIST_PICKER_TOGGLE_STATES.CLOSED;

    return {
      ACTIVE_FOOTER,
      MESSAGES_POLLING_TIMEOUT,
      MESSAGES_FORCE_POLLING_TIMEOUT,
      USER_INPUT_TYPES,
      HTML_INPUT_TYPES,
      CURSOR_TYPES,
      MAX_POLLER_FAILURES_ALLOWED,
      USER_REDACTION_ERR_MSG,
      USER_REDACTION_ERR_STATUS_CODE,
      PICKER_INPUT_THRESHOLD: 5,
      OPTIONS_INPUT_TYPES,
      PICKER_MIN_HEIGHT: 112, // px
      DEFAULT_LIST_PICKER_TOGGLE_STATE
    };
  });
