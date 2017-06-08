/**
 * Entry point for web sdk.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

require (
  [
    "utils/postMessage",
    "constants/eventTypes",
    "extras/api"
  ],
  function (postMessage, EVENT_TYPES, api) {
    "use strict";

    /**
     * Receive Message and take required action.
     * @param {Event} event
     */
    const onMessage = function (event) {
      const {type, data} = JSON.parse (event.data);
      api.handle (type, data);
    };

    window.addEventListener ("message", onMessage, false);

    postMessage (EVENT_TYPES.SDK_JS_LOADED);
  });
