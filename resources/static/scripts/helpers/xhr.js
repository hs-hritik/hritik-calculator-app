/**
 * XHR helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 21, 2017
 */

define ("helpers/xhr",
  ["store"],
  function (store) {
    "use strict";

    /**
     * Return common headers which are to be passed to each xhr request.
     * @returns {Object} - header key-value pairs.
     */
    const getCommonHeaders = () => {
      const {platformId} = store.getState ().appState;
      return {
        authorization: "Basic " + btoa (platformId + ":")
      };
    };

    return {
      getCommonHeaders
    };
  });
