/**
 * Util to post message to parent window.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("utils/postMessage",
  function () {
    "use strict";

    /**
     * Post message to the parent page.
     * @param {object} config - object with data to call the postMessage API
     * @param {string} config.type - type of message.
     * @param {object} config.data - data for the message.
     * @param {string} [config.parentPageOrigin] - domain of the parent page
     */
    return ({type, data, parentPageOrigin = "*"}) => {
      window.parent.postMessage (JSON.stringify ({
        type,
        data
      }), parentPageOrigin);
    };
  });
