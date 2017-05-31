/**
 * Util to post message to parent window.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("utils/postMessage",
  function () {
    "use strict";

    /**
     * Post message to the parent.
     * @param {string} type - type of message.
     * @param {object} [data] - data for the message.
     */
    return function (type, data) {
      window.parent.postMessage (JSON.stringify ({
        type,
        data
      }), "*");
    };
  });
