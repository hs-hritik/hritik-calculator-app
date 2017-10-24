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
      CMD_MESSENGER_TOGGLED: "cmd-messenger-toggled",
      CMD_INITIALISE: "cmd-initialise",
      CMD_SET_CONFIG: "cmd-set-config",
      CMD_RESET: "cmd-reset",
      CMD_SET_INITIAL_USER_MESSAGE: "cmd-set-initial-user-message",
      CMD_SET_CIF: "cmd-set-cif",
      CMD_REPLACE_CIF: "cmd-replace-cif",
      CMD_SET_PARENT_INFO: "cmd-set-parent-info"
    };
  });
