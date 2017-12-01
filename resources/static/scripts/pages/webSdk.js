/**
 * Entry point for web sdk.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

require (
  [
    "extras/postSdkMessage",
    "extras/api"
  ],
  function (postSdkMessage, api) {
    "use strict";

    /**
     * Receive Message and take required action.
     * @param {Event} event
     */
    const onMessage = (event) => {
      try {
        const {type, data} = JSON.parse (event.data);
        api.handle (type, data);
      } catch (exception) {
        // We are not handling any kind of exception if data parsing fails
      }
    };

    window.addEventListener ("message", onMessage, false);

    postSdkMessage.jsLoaded ();
  });
