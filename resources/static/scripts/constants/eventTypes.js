/**
 * Event type constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("constants/eventTypes",
  function () {
    "use strict";

    return {
      SDK_JS_LOADED: "sdk-js-loaded",
      SDK_CONFIG_LOADED: "sdk-config-loaded",
      SDK_TOGGLE_MESSENGER: "sdk-toggle-messenger",
      SDK_RESET: "sdk-reset",
      SDK_UPDATE_UNREAD_COUNT: "sdk-update-unread-count",
      SDK_EVENT_CHAT_END: "sdk-event-chat-end",
      SDK_GET_PARENT_INFO: "sdk-get-parent-info",
      SDK_UI_CONFIG_UPDATED: "sdk-ui-config-updated",
      SDK_UPDATE_UI_CONFIG_ERRORS: "sdk-update-ui-config-errors",
      CMD_MESSENGER_TOGGLED: "cmd-messenger-toggled",
      CMD_SET_CONFIG: "cmd-set-config",
      CMD_RESET: "cmd-reset",
      CMD_SET_INITIAL_USER_MESSAGE: "cmd-set-initial-user-message",
      CMD_SET_GREETING_MESSAGE: "cmd-set-greeting-message",
      CMD_SET_LANGUAGE: "cmd-set-language",
      CMD_SET_CIF: "cmd-set-cif",
      CMD_REPLACE_CIF: "cmd-replace-cif",
      CMD_SET_PARENT_PAGE_INFO: "cmd-set-parent-page-info",
      CMD_SET_EXEC_PROACTIVE_CHAT_RULES: "cmd-set-execute-proactive-chat-rules",
      CMD_UPDATE_UI_CONFIG: "cmd-update-ui-config",
      CMD_SET_FULL_PRIVACY: "cmd-set-full-privacy"
    };
  });
