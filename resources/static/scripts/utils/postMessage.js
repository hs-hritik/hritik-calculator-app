/**
 * Util to post message to parent window.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("utils/postMessage",
  ["store"],
  function (store) {
    "use strict";

    /**
     * Post message to the parent.
     * @param {string} type - type of message.
     * @param {object} [data] - data for the message.
     */
    return (type, data) => {
      const {
        appState: {
          parentPageInfo: {
            origin: parentPageOrigin
          }
        }
      } = store.getState ();

      window.parent.postMessage (JSON.stringify ({
        type,
        data
      }), parentPageOrigin || "*");
    };
  });
