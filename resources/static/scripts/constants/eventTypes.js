/**
 * Event type constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define("constants/eventTypes", function() {
  "use strict";

  return {
    SDK_JS_LOADED: "sdk-js-loaded",
    SDK_CONFIG_LOADED: "sdk-config-loaded",
    SDK_TOGGLE_MESSENGER: "sdk-toggle-messenger",
    SDK_RESET: "sdk-reset",
    SDK_UPDATE_UNREAD_COUNT: "sdk-update-unread-count",
    SDK_EVENT_CHAT_END: "sdk-event-chat-end",
    SDK_EVENT_CONVERSATION_START: "sdk-event-conversation-start",
    SDK_EVENT_CONVERSATION_END: "sdk-event-conversation-end",
    SDK_EVENT_CONVERSATION_REOPENED: "sdk-event-conversation-reopened",
    SDK_EVENT_CONVERSATION_RESOLVED: "sdk-event-conversation-resolved",
    SDK_EVENT_CONVERSATION_REJECTED: "sdk-event-conversation-rejected",
    SDK_EVENT_MESSAGE_ADD: "sdk-event-message-add",
    SDK_EVENT_CSAT_SUBMIT: "sdk-event-csat-submit",
    SDK_EVENT_CONVERSATION_STATUS: "sdk-event-conversation-status",
    SDK_UI_CONFIG_UPDATED: "sdk-ui-config-updated",
    SDK_UPDATE_UI_CONFIG_ERRORS: "sdk-update-ui-config-errors",
    SDK_USER_CHANGED_VIA_RE_ENGAGEMENT: "sdk-user-changed-via-re-engagement",
    SDK_FOCUS_LAUNCHER: "sdk-focus-launcher",
    SDK_EVENT_ON_SET_LOCAL_STORAGE_DATA: "sdk-on-set-local-storage-data",
    SDK_EVENT_ON_REMOVE_LOCAL_STORAGE_DATA: "sdk-on-remove-local-storage-data",
    SDK_EVENT_ON_UI_CONFIG_CHANGE: "sdk-on-ui-config-change",
    SDK_EVENT_ON_PUSH_TOKEN_SYNC: "sdk-on-push-token-sync",
    SDK_EVENT_ON_USER_AUTH_FAILURE: "sdk-on-user-auth-failure",
    SDK_EVENT_ON_REMOVE_ANONYMOUS_USER: "sdk-on-remove-anonymous-user",
    SDK_EVENT_SAFE_AREA_COLOR: "sdk-event-safe-area-color",
    CMD_FOCUS_WEBCHAT: "cmd-focus-webchat",
    CMD_MESSENGER_TOGGLED: "cmd-messenger-toggled",
    CMD_SET_CONFIG: "cmd-set-config",
    CMD_SET_INITIAL_USER_MESSAGE: "cmd-set-initial-user-message",
    CMD_SET_GREETING_MESSAGE: "cmd-set-greeting-message",
    CMD_SET_LANGUAGE: "cmd-set-language",
    CMD_SET_CIF: "cmd-set-cif",
    CMD_SET_METADATA: "cmd-set-metadata",
    CMD_REPLACE_CIF: "cmd-replace-cif",
    CMD_SET_EXEC_PROACTIVE_CHAT_RULES: "cmd-set-execute-proactive-chat-rules",
    CMD_UPDATE_UI_CONFIG: "cmd-update-ui-config",
    CMD_SET_FULL_PRIVACY: "cmd-set-full-privacy",
    CMD_UPDATE_HELPSHIFT_CONFIG: "cmd-update-helpshift-config",
    CMD_SET_PARENT_PAGE_VISIBILITY: "cmd-set-parent-page-visibility",
    CMD_SET_DISABLE_PFI: "cmd-set-disable-pfi",
    CMD_SET_ENABLE_PFI: "cmd-set-enable-pfi"
  };
});
