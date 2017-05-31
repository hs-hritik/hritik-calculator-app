/**
 * Entry point for web sdk.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

require (
  ["helpers/messageHandler",
    "utils/postMessage",
    "constants/eventTypes"],
  function (messageHandler, postMessage, EVENT_TYPES) {
    "use strict";

    messageHandler.init ();
    postMessage (EVENT_TYPES.SDK_JS_LOADED);
  });
