/**
 * Helper to listen to window's message event and take required action.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("helpers/messageHandler",
  ["components/app",
    "constants/eventTypes"],
  function (app, EVENT_TYPES) {
    "use strict";

    let listening = false;

    /**
     * Receive Message and take required action.
     * @param {Event} event
     */
    const onMessage = function (event) {
      const {type, data} = JSON.parse (event.data);

      if (type === EVENT_TYPES.SDK_INITIALISED) {
        app.init (data);
      }
    };

    /**
     * Start listening for the parent messages.
     */
    const init = function () {
      if (!listening) {
        window.addEventListener ("message", onMessage, false);
        listening = true;
      }
    };

    return {
      init
    };
  }
);
