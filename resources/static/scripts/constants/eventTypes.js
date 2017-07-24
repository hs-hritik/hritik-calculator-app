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
      SDK_ISSUES_LOADED: "sdk-issues-loaded",
      CMD_INITIALISE: "cmd-initialise",
      CMD_SET_USER: "cmd-set-user"
    };
  });
