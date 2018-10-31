/**
 * Entry point for web sdk.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

require (
  [
    "extras/postSdkMessage",
    "extras/api",
    "extras/globalEvents"
  ],
  function (postSdkMessage, api, globalEvents) {
    "use strict";

    /**
     * Receive Message and take required action.
     * @param {Event} event
     */
    const onMessage = (event) => {
      let type, data;

      try {
        const eventData = JSON.parse (event.data);
        type = eventData.type;
        data = eventData.data;
      } catch (exception) {
        // We are not handling any kind of exception if data parsing fails
      } finally {
        if (type) {
          api.handle (type, data);
        }
      }
    };

    window.addEventListener ("message", onMessage, false);

    globalEvents.addFocusAndBlurEventListener ();

    postSdkMessage.jsLoaded ();
  });
