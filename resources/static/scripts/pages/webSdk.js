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
      const {type, data} = JSON.parse (event.data);
      api.handle (type, data);
    };

    window.addEventListener ("message", onMessage, false);

    postSdkMessage.jsLoaded ();
  });
