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
      LAUNCHER_BTN: "launcher-btn"
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
      LAUNCHER_BTN: "LAUNCHER_BTN"
    };

    /**
     * Selectors are used to focus on an element present in flat-list.
     */
    const DATA_LABEL_SELECTORS = {
      OOBH: {
        WRAPPER: "[data-label=oobh-wrapper]",
        NAME: "[data-label=oobh-name]",
        EMAIL: "[data-label=oobh-email]",
        MSG: "[data-label=oobh-message]",
        FILE_SELECT: "[data-label=oobh-file-select]",
        FOOTER_BTN: "[data-label=oobh-footer-btn]",
        OFFLINE_MSG: "[data-label=oobh-offline-msg]"
      },
      LAUNCHER_BTN: "[data-label=launcher-btn]"
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
