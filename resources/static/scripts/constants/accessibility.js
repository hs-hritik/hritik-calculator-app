/**
 * Accessibility constants.
 * @author Riya Bagaria <riya@helpshift.com>
 * @created Aug 30, 2019
 */

define ("constants/accessibility",
  function () {
    "use strict";

    const DIRECTIONS = {
      FORWARD: "forward",
      BACKWARD: "backward"
    };

    const KEYCODES = {
      ENTER: 13,
      UP_ARROW: 38,
      DOWN_ARROW: 40,
      RIGHT_ARROW: 39,
      LEFT_ARROW: 37,
      TAB: 9,
      SPACE: 32
    };

    const OOBH_TYPE = {
      FORM: "OOBH_FORM",
      OFFLINE_MSG: "OFFLINE_MSG"
    };

    /**
     * Data label constants are required for unique identification of an UI element
     */
    const DATA_LABELS = {
      OOBH: {
        WRAPPER: "oobh-wrapper",
        NAME: "oobh-name",
        EMAIL: "oobh-email",
        MESSAGE: "oobh-message",
        ATTACHMENT_PREFIX: "oobh-attachment-",
        FILE_SELECT: "oobh-file-select",
        FOOTER_BTN: "oobh-footer-btn",
        OFFLINE_MSG: "oobh-offline-msg"
      },
      LAUNCHER_BTN: "launcher-btn",
      CHAT: {
        TEXT_FIELD: "chat-footer-text-field",
        TEXT_AREA: "chat-footer-text-area",
        SEND_BTN: "chat-footer-send-btn",
        ATTACHMENT_BTN: "chat-footer-attachment-btn",
        OPTION_PILLS_WRAPPER: "chat-footer-option-pills-wrapper",
        OPTION_PILL_PREFIX: "option-pills-option-",
        COLLAPSED_PICKER_HEADER: "list-picker-collapsed-header",
        PICKER_OPTIONS_WRAPPER: "list-picker-options-wrapper",
        COLLAPSED_PICKER_BTN: "list-picker-collapsed-btn",
        PICKER_SEARCH_BTN: "list-picker-search-btn",
        PICKER_SEARCH_INPUT: "list-picker-search-input",
        PICKER_BACK_ARROW: "list-picker-back-arrow",
        PICKER_CLEAR_SEARCH_BTN: "list-picker-clear-search-btn",
        CONVERSATION_RESOLUTION_WRAPPER: "conversation-resolution-wrapper",
        SOLUTION_REJECT_BTN: "solution-reject-btn",
        SOLUTION_ACCEPT_BTN: "solution-accept-btn",
        STAR_RATING_WRAPPER: "star-rating-wrapper",
        NEW_CONVERSATION_BTN: "new-conversation-wrapper",
        CLOSE_CONVERSATION_BTN: "close-conversation-btn",
        SKIP_BTN: "skip-btn"
      },
      CSAT: {
        STAR_RATING_WRAPPER: "star-rating-wrapper",
        FEEDBACK_TEXT_AREA: "additional-feedback-text-area",
        FOOTER_BTN: "footer-btn"
      },
      FAQ: {
        CONTENT_WRAPPER: "content-wrapper",
        BACK_BTN: "back-btn"
      }
    };

    /**
     * The data label name is required to identify the selectors by readable names
     * Ex- While adding a selector, we need the data-label name to find
     * the selectors list in meta-list
     */
    const DATA_LABEL_NAME = {
      OOBH: {
        WRAPPER: "OOBH_WRAPPER",
        NAME: "OOBH_NAME",
        EMAIL: "OOBH_EMAIL",
        MESSAGE: "OOBH_MSG",
        FILE_ATTACHMENTS: "OOBH_FILE_ATTACHMENT",
        FILE_SELECT: "OOBH_FILE_SELECT",
        FOOTER_BTN: "OOBH_FOOTER_BTN",
        OFFLINE_MSG: "OOBH_OFFLINE_MSG"
      },
      LAUNCHER_BTN: "LAUNCHER_BTN",
      CHAT: {
        FOOTER: "FOOTER",
        MESSAGE_LIST: "MESSAGE_LIST",
        SKIP_BTN: "SKIP_BTN"
      },
      CSAT: {
        STAR_RATING_WRAPPER: "STAR_RATING_WRAPPER",
        FEEDBACK_TEXT_AREA: "FEEDBACK_TEXT_AREA",
        FOOTER_BTN: "FOOTER_BTN"
      },
      FAQ: {
        CONTENT_WRAPPER: "CONTENT_WRAPPER",
        BACK_BTN: "BACK_BTN",
        FAQ_BODY_LINKS: "FAQ_BODY_LINKS"
      }
    };

    // @TODO: Restructure the constants
    const FOOTER_SELECTORS = {
      TEXT_FIELD: "[data-label=" + DATA_LABELS.CHAT.TEXT_FIELD + "]",
      TEXT_AREA: "[data-label=" + DATA_LABELS.CHAT.TEXT_AREA + "]",
      SEND_BTN: "[data-label=" + DATA_LABELS.CHAT.SEND_BTN + "]",
      ATTACHMENT_BTN: "[data-label=" + DATA_LABELS.CHAT.ATTACHMENT_BTN + "]",
      OPTION_PILLS_WRAPPER: "[data-label=" + DATA_LABELS.CHAT.OPTION_PILLS_WRAPPER + "]",
      COLLAPSED_PICKER_HEADER: "[data-label=" + DATA_LABELS.CHAT.COLLAPSED_PICKER_HEADER + "]",
      PICKER_OPTIONS_WRAPPER: "[data-label=" + DATA_LABELS.CHAT.PICKER_OPTIONS_WRAPPER + "]",
      COLLAPSED_PICKER_BTN: "[data-label=" + DATA_LABELS.CHAT.COLLAPSED_PICKER_BTN + "]",
      PICKER_SEARCH_BTN: "[data-label=" + DATA_LABELS.CHAT.PICKER_SEARCH_BTN + "]",
      PICKER_SEARCH_INPUT: "[data-label=" + DATA_LABELS.CHAT.PICKER_SEARCH_INPUT + "]",
      PICKER_BACK_ARROW: "[data-label=" + DATA_LABELS.CHAT.PICKER_BACK_ARROW + "]",
      PICKER_CLEAR_SEARCH_BTN: "[data-label=" + DATA_LABELS.CHAT.PICKER_CLEAR_SEARCH_BTN + "]",
      CONVERSATION_RESOLUTION_WRAPPER: (
        "[data-label=" + DATA_LABELS.CHAT.CONVERSATION_RESOLUTION_WRAPPER + "]"
      ),
      SOLUTION_REJECT_BTN: "[data-label=" + DATA_LABELS.CHAT.SOLUTION_REJECT_BTN + "]",
      SOLUTION_ACCEPT_BTN: "[data-label=" + DATA_LABELS.CHAT.SOLUTION_ACCEPT_BTN + "]",
      STAR_RATING_WRAPPER: "[data-label=" + DATA_LABELS.CHAT.STAR_RATING_WRAPPER + "]",
      NEW_CONVERSATION_BTN: "[data-label=" + DATA_LABELS.CHAT.NEW_CONVERSATION_BTN + "]",
      CLOSE_CONVERSATION_BTN: "[data-label=" + DATA_LABELS.CHAT.CLOSE_CONVERSATION_BTN + "]"
    };

    /**
     * These selectors will bee used in meta-list
     * Selectors are used to focus on an element present in flat-list.
     */
    // @TODO: Flaten and restructure the chat footer object
    const DATA_LABEL_SELECTORS = {
      OOBH: {
        WRAPPER: "[data-label=" + DATA_LABELS.OOBH.WRAPPER + "]",
        NAME: "[data-label=" + DATA_LABELS.OOBH.NAME + "]",
        EMAIL: "[data-label=" + DATA_LABELS.OOBH.EMAIL + "]",
        MSG: "[data-label=" + DATA_LABELS.OOBH.MESSAGE + "]",
        FILE_SELECT: "[data-label=" + DATA_LABELS.OOBH.FILE_SELECT + "]",
        FOOTER_BTN: "[data-label=" + DATA_LABELS.OOBH.FOOTER_BTN + "]",
        OFFLINE_MSG: "[data-label=" + DATA_LABELS.OOBH.OFFLINE_MSG + "]"
      },
      LAUNCHER_BTN: "[data-label=" + DATA_LABELS.LAUNCHER_BTN + "]",
      CHAT: {
        FOOTER: {
          DEFAULT_INPUT: [
            FOOTER_SELECTORS.TEXT_AREA,
            FOOTER_SELECTORS.SEND_BTN,
            FOOTER_SELECTORS.ATTACHMENT_BTN
          ],
          PLAIN_TEXT: [
            FOOTER_SELECTORS.TEXT_FIELD,
            FOOTER_SELECTORS.SEND_BTN
          ],
          OPTION_PILL: [
            FOOTER_SELECTORS.OPTION_PILLS_WRAPPER
          ],
          PICKER:[
            FOOTER_SELECTORS.COLLAPSED_PICKER_HEADER,
            FOOTER_SELECTORS.COLLAPSED_PICKER_BTN,
            FOOTER_SELECTORS.PICKER_BACK_ARROW,
            FOOTER_SELECTORS.PICKER_SEARCH_BTN,
            FOOTER_SELECTORS.PICKER_SEARCH_INPUT,
            FOOTER_SELECTORS.PICKER_CLEAR_SEARCH_BTN,
            FOOTER_SELECTORS.PICKER_OPTIONS_WRAPPER
          ],
          RESOLUTION_QUESTION: [
            FOOTER_SELECTORS.CONVERSATION_RESOLUTION_WRAPPER,
            FOOTER_SELECTORS.SOLUTION_REJECT_BTN,
            FOOTER_SELECTORS.SOLUTION_ACCEPT_BTN
          ],
          SOLUTION_REJECTED: [
            FOOTER_SELECTORS.TEXT_AREA,
            FOOTER_SELECTORS.SEND_BTN,
            FOOTER_SELECTORS.ATTACHMENT_BTN
          ],
          CSAT: [
            FOOTER_SELECTORS.STAR_RATING_WRAPPER
          ],
          START_NEW_CONVERSATION: [
            FOOTER_SELECTORS.NEW_CONVERSATION_BTN
          ],
          CLOSED: [
            FOOTER_SELECTORS.CLOSE_CONVERSATION_BTN
          ]
        },
        TEXT_FIELD: "[data-label=" + DATA_LABELS.CHAT.TEXT_FIELD + "]",
        TEXT_AREA: "[data-label=" + DATA_LABELS.CHAT.TEXT_AREA + "]",
        SEND_BTN: "[data-label=" + DATA_LABELS.CHAT.SEND_BTN + "]",
        ATTACHMENT_BTN: "[data-label=" + DATA_LABELS.CHAT.ATTACHMENT_BTN + "]",
        OPTION_PILLS_WRAPPER: "[data-label=" + DATA_LABELS.CHAT.OPTION_PILLS_WRAPPER + "]",
        COLLAPSED_PICKER_HEADER: "[data-label=" + DATA_LABELS.CHAT.COLLAPSED_PICKER_HEADER + "]",
        PICKER_OPTION_WRAPPER: "[data-label=" + DATA_LABELS.CHAT.PICKER_OPTION_WRAPPER + "]",
        COLLAPSED_PICKER_BTN: "[data-label=" + DATA_LABELS.CHAT.COLLAPSED_PICKER_BTN + "]",
        PICKER_SEARCH_BTN: "[data-label=" + DATA_LABELS.CHAT.PICKER_SEARCH_BTN + "]",
        PICKER_SEARCH_INPUT: "[data-label=" + DATA_LABELS.CHAT.PICKER_SEARCH_INPUT + "]",
        PICKER_BACK_ARROW: "[data-label=" + DATA_LABELS.CHAT.PICKER_BACK_ARROW + "]",
        PICKER_CLEAR_SEARCH_BTN: "[data-label=" + DATA_LABELS.CHAT.PICKER_CLEAR_SEARCH_BTN + "]",
        CONVERSATION_RESOLUTION_WRAPPER: (
          "[data-label=" +
          DATA_LABELS.CHAT.CONVERSATION_RESOLUTION_WRAPPER +
          "]"
        ),
        SOLUTION_REJECT_BTN: "[data-label=" + DATA_LABELS.CHAT.SOLUTION_REJECT_BTN + "]",
        SOLUTION_ACCEPT_BTN: "[data-label=" + DATA_LABELS.CHAT.SOLUTION_ACCEPT_BTN + "]",
        STAR_RATING_WRAPPER: "[data-label=" + DATA_LABELS.CHAT.STAR_RATING_WRAPPER + "]",
        NEW_CONVERSATION_BTN: "[data-label=" + DATA_LABELS.CHAT.NEW_CONVERSATION_BTN + "]",
        CLOSE_CONVERSATION_BTN: "[data-label=" + DATA_LABELS.CHAT.CLOSE_CONVERSATION_BTN + "]",
        SKIP_BTN: "[data-label=" + DATA_LABELS.CHAT.SKIP_BTN + "]"
      },
      CSAT: {
        STAR_RATING_WRAPPER: "[data-label=" + DATA_LABELS.CSAT.STAR_RATING_WRAPPER + "]",
        FEEDBACK_TEXT_AREA: "[data-label=" + DATA_LABELS.CSAT.FEEDBACK_TEXT_AREA + "]",
        FOOTER_BTN: "[data-label=" + DATA_LABELS.CSAT.FOOTER_BTN + "]"
      },
      FAQ: {
        CONTENT_WRAPPER: "[data-label=" + DATA_LABELS.FAQ.CONTENT_WRAPPER + "]",
        BACK_BTN: "[data-label=" + DATA_LABELS.FAQ.BACK_BTN + "]"
      }
    };

    return {
      DIRECTIONS,
      KEYCODES,
      DATA_LABELS,
      DATA_LABEL_SELECTORS,
      DATA_LABEL_NAME,
      OOBH_TYPE
    };
  }
);
