/**
 * Util to post message to parent window.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("utils/postMessage",
  [
    "store",
    "gunpowder/utils/url"
  ],
  function (store, urlUtils) {
    "use strict";

    /**
     * Gets the origin of the parent page by reading the query string of the web
     * chat iframe's URL. Falls back to the origin stored in the state and "*".
     * @returns {string} - the origin string.
     */
    const _getParentPageOrigin = () => {
      const {
        appState: {
          parentPageInfo: {
            origin: parentPageOrigin
          }
        }
      } = store.getState ();

      const urlParams = urlUtils.getQueryParams (window.document.location);

      if (urlParams.get ("parent")) {
        return urlParams.get ("parent");
      }

      return parentPageOrigin || "*";
    };

    /**
     * Post message to the parent page.
     * @param {string} type - type of message.
     * @param {object} [data] - data for the message.
     */
    return (type, data) => {
      const parentPageOrigin = _getParentPageOrigin ();

      window.parent.postMessage (JSON.stringify ({
        type,
        data
      }), parentPageOrigin);
    };
  });
