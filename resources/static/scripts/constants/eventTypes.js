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
      SDK_INITIALISED: "sdk-initialised",
      SDK_CONFIG_LOADED: "sdk-config-loaded",
      SDK_ISSUES_LOADED: "sdk-issues-loaded",
      SDK_TOGGLE_IFRAME: "sdk-toggle-iframe",
      CMD_IFRAME_TOGGLED: "cmd-iframe-toggled",
      CMD_INITIALISE: "cmd-initialise",
      CMD_SET_CONFIG: "cmd-set-config",
      CMD_SET_USER: "cmd-set-user"
    };
  });
