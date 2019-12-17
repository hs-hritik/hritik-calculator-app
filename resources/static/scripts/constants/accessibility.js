/**
 * Accessibility constants.
 * @author Riya Bagaria <riya@helpshift.com>
 * @created Aug 30, 2019
 */

define("constants/accessibility", function() {
  "use strict";

  const DIRECTIONS = {
    FORWARD: "forward",
    BACKWARD: "backward"
  };

  const OOBH_SUBVIEW = {
    FORM: "OOBH_FORM",
    OFFLINE_MSG: "OFFLINE_MSG"
  };

  /**
   * The meta list group name is required to identify the selectors by readable names
   * Ex- While adding a selector, we need the meta list group name to find
   * the selectors list in meta-list
   */
  const METALIST_GROUP_NAME = {
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
      MSGS_SCROLL_WRAPPER: "MSGS_SCROLL_WRAPPER",
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

  const METALIST_ITEMS = {
    LAUNCHER_BTN: {
      GROUP: METALIST_GROUP_NAME.LAUNCHER_BTN,
      DATA_LABEL: "launcher-btn",
      SELECTOR: "[data-label=launcher-btn]"
    },
    OOBH: {
      WRAPPER: {
        GROUP: METALIST_GROUP_NAME.OOBH.WRAPPER,
        DATA_LABEL: "oobh-wrapper",
        SELECTOR: "[data-label=oobh-wrapper]"
      },
      NAME: {
        GROUP: METALIST_GROUP_NAME.OOBH.NAME,
        DATA_LABEL: "oobh-name",
        SELECTOR: "[data-label=oobh-name]"
      },
      EMAIL: {
        GROUP: METALIST_GROUP_NAME.OOBH.EMAIL,
        DATA_LABEL: "oobh-email",
        SELECTOR: "[data-label=oobh-email]"
      },
      MESSAGE: {
        GROUP: METALIST_GROUP_NAME.OOBH.MESSAGE,
        DATA_LABEL: "oobh-message",
        SELECTOR: "[data-label=oobh-message]"
      },
      ATTACHMENT_PREFIX: {
        DATA_LABEL: "oobh-attachment-"
      },
      FILE_ATTACHMENTS: {
        GROUP: METALIST_GROUP_NAME.OOBH.FILE_ATTACHMENTS
      },
      FILE_SELECT: {
        GROUP: METALIST_GROUP_NAME.OOBH.FILE_SELECT,
        DATA_LABEL: "oobh-file-select",
        SELECTOR: "[data-label=oobh-file-select]"
      },
      FOOTER_BTN: {
        GROUP: METALIST_GROUP_NAME.OOBH.FOOTER_BTN,
        DATA_LABEL: "oobh-footer-btn",
        SELECTOR: "[data-label=oobh-footer-btn]"
      },
      OFFLINE_MSG: {
        GROUP: METALIST_GROUP_NAME.OOBH.OFFLINE_MSG,
        DATA_LABEL: "oobh-offline-msg",
        SELECTOR: "[data-label=oobh-offline-msg]"
      }
    },
    CHAT: {
      MSGS_SCROLL_WRAPPER: {
        GROUP: METALIST_GROUP_NAME.CHAT.MSGS_SCROLL_WRAPPER,
        DATA_LABEL: "msg-list-wrapper",
        SELECTOR: "[data-label=msg-list-wrapper]"
      },
      MESSAGE_LIST: {
        GROUP: METALIST_GROUP_NAME.CHAT.MESSAGE_LIST
      },
      SKIP_BTN: {
        GROUP: METALIST_GROUP_NAME.CHAT.SKIP_BTN,
        DATA_LABEL: "skip-btn",
        SELECTOR: "[data-label=skip-btn]"
      },
      FOOTER: {
        TEXT_FIELD: {
          GROUP: METALIST_GROUP_NAME.CHAT.FOOTER,
          DATA_LABEL: "chat-footer-text-field",
          SELECTOR: "[data-label=chat-footer-text-field]"
        },
        TEXT_AREA: {
          GROUP: METALIST_GROUP_NAME.CHAT.FOOTER,
          DATA_LABEL: "chat-footer-text-area",
          SELECTOR: "[data-label=chat-footer-text-area]"
        },
        SEND_BTN: {
          GROUP: METALIST_GROUP_NAME.CHAT.FOOTER,
          DATA_LABEL: "chat-footer-send-btn",
          SELECTOR: "[data-label=chat-footer-send-btn]"
        },
        ATTACHMENT_BTN: {
          GROUP: METALIST_GROUP_NAME.CHAT.FOOTER,
          DATA_LABEL: "chat-footer-attachment-btn",
          SELECTOR: "[data-label=chat-footer-attachment-btn]"
        },
        OPTION_PILLS_WRAPPER: {
          GROUP: METALIST_GROUP_NAME.CHAT.FOOTER,
          DATA_LABEL: "chat-footer-option-pills-wrapper",
          SELECTOR: "[data-label=chat-footer-option-pills-wrapper]"
        },
        OPTION_PILL_PREFIX: {
          GROUP: METALIST_GROUP_NAME.CHAT.FOOTER,
          DATA_LABEL: "option-pills-option-"
        },
        CONVERSATION_RESOLUTION_WRAPPER: {
          GROUP: METALIST_GROUP_NAME.CHAT.FOOTER,
          DATA_LABEL: "conversation-resolution-wrapper",
          SELECTOR: "[data-label=conversation-resolution-wrapper]"
        },
        SOLUTION_REJECT_BTN: {
          GROUP: METALIST_GROUP_NAME.CHAT.FOOTER,
          DATA_LABEL: "solution-reject-btn",
          SELECTOR: "[data-label=solution-reject-btn]"
        },
        SOLUTION_ACCEPT_BTN: {
          GROUP: METALIST_GROUP_NAME.CHAT.FOOTER,
          DATA_LABEL: "solution-accept-btn",
          SELECTOR: "[data-label=solution-accept-btn]"
        },
        STAR_RATING_WRAPPER: {
          GROUP: METALIST_GROUP_NAME.CHAT.FOOTER,
          DATA_LABEL: "star-rating-wrapper",
          SELECTOR: "[data-label=star-rating-wrapper]"
        },
        NEW_CONVERSATION_BTN: {
          GROUP: METALIST_GROUP_NAME.CHAT.FOOTER,
          DATA_LABEL: "new-conversation-wrapper",
          SELECTOR: "[data-label=new-conversation-wrapper]"
        },
        CLOSE_CONVERSATION_BTN: {
          GROUP: METALIST_GROUP_NAME.CHAT.FOOTER,
          DATA_LABEL: "close-conversation-btn",
          SELECTOR: "[data-label=close-conversation-btn]"
        }
      }
    },
    CSAT: {
      STAR_RATING_WRAPPER: {
        GROUP: METALIST_GROUP_NAME.CSAT.STAR_RATING_WRAPPER,
        DATA_LABEL: "star-rating-wrapper",
        SELECTOR: "[data-label=star-rating-wrapper]"
      },
      FEEDBACK_TEXT_AREA: {
        GROUP: METALIST_GROUP_NAME.CSAT.FEEDBACK_TEXT_AREA,
        DATA_LABEL: "additional-feedback-text-area",
        SELECTOR: "[data-label=additional-feedback-text-area]"
      },
      FOOTER_BTN: {
        GROUP: METALIST_GROUP_NAME.CSAT.FOOTER_BTN,
        DATA_LABEL: "footer-btn",
        SELECTOR: "[data-label=footer-btn]"
      }
    },
    FAQ: {
      CONTENT_WRAPPER: {
        GROUP: METALIST_GROUP_NAME.FAQ.CONTENT_WRAPPER,
        DATA_LABEL: "content-wrapper",
        SELECTOR: "[data-label=content-wrapper]"
      },
      BACK_BTN: {
        GROUP: METALIST_GROUP_NAME.FAQ.BACK_BTN,
        DATA_LABEL: "back-btn",
        SELECTOR: "[data-label=back-btn]"
      },
      FAQ_BODY_LINKS: {
        GROUP: METALIST_GROUP_NAME.FAQ.FAQ_BODY_LINKS
      }
    }
  };

  /**
   * This is a map of selectors list for different footers
   * For easy use in views/components, pre composing this list
   * Directly pick items from this map and
   * use it in views/components to replace footer selectors.
   */
  const FOOTER_SELECTORS_LIST_MAP = {
    DEFAULT_INPUT: [
      METALIST_ITEMS.CHAT.FOOTER.TEXT_AREA.SELECTOR,
      METALIST_ITEMS.CHAT.FOOTER.SEND_BTN.SELECTOR,
      METALIST_ITEMS.CHAT.FOOTER.ATTACHMENT_BTN.SELECTOR
    ],
    PLAIN_TEXT: [
      METALIST_ITEMS.CHAT.FOOTER.TEXT_FIELD.SELECTOR,
      METALIST_ITEMS.CHAT.FOOTER.SEND_BTN.SELECTOR
    ],
    OPTION_PILL: [METALIST_ITEMS.CHAT.FOOTER.OPTION_PILLS_WRAPPER.SELECTOR],
    RESOLUTION_QUESTION: [
      METALIST_ITEMS.CHAT.FOOTER.CONVERSATION_RESOLUTION_WRAPPER.SELECTOR,
      METALIST_ITEMS.CHAT.FOOTER.SOLUTION_REJECT_BTN.SELECTOR,
      METALIST_ITEMS.CHAT.FOOTER.SOLUTION_ACCEPT_BTN.SELECTOR
    ],
    SOLUTION_REJECTED: [
      METALIST_ITEMS.CHAT.FOOTER.TEXT_AREA.SELECTOR,
      METALIST_ITEMS.CHAT.FOOTER.SEND_BTN.SELECTOR,
      METALIST_ITEMS.CHAT.FOOTER.ATTACHMENT_BTN.SELECTOR
    ],
    CSAT: [METALIST_ITEMS.CSAT.STAR_RATING_WRAPPER.SELECTOR],
    START_NEW_CONVERSATION: [METALIST_ITEMS.CHAT.FOOTER.NEW_CONVERSATION_BTN.SELECTOR],
    CLOSE_CONVERSATION: [METALIST_ITEMS.CHAT.FOOTER.CLOSE_CONVERSATION_BTN.SELECTOR]
  };

  return {
    DIRECTIONS,
    METALIST_GROUP_NAME,
    OOBH_SUBVIEW,
    METALIST_ITEMS,
    FOOTER_SELECTORS_LIST_MAP
  };
});
