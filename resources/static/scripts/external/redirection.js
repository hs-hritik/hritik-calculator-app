/**
 * JS for getting the user config from backend and depending
 * on data creating an iframe for the respective truncate_pid.hs.com
 * The purpose of all of this is to set the appropriate values
 * from user's previous session into the local storage so that
 * user can continue the conversation.
 *
 * @author Aniket Hendre <aniket@helpshift.com>
 * @created Sep 10, 2018
 */

(function (win) {
  "use strict";

  const ENV_API_ROOT = "{{ENV_API_ROOT}}";
  const GET_USER_CONFIG_URL = "/websdk/get-user-config/";
  const SEND_LISTEN_MESSAGE_TYPES = {
    SET_LS: "set-ls",
    SET_LS_DONE: "set-ls-done",
    IFRAME_LOADED: "iframe-loaded"
  };

  /**
   * Generates store object containing key-value pairs from the URL's query params.
   *
   * This is a workaround for IE & older versions of Safari.
   * If URLSearchParams constructor is not present then use
   *  _localUrlSearchParams.
   *
   * @returns {Object} - Contaings method to get the individual query param
   */
  const _localUrlSearchParams = () => {
    // To see railroad diagram of the following reg exp visit:
    // https://regexper.com/#%2F%28%5B%5E%26%3D%5D%2B%29%3D%3F%28%5B%5E%26%5D*%29%2Fg
    const regex = /([^&=]+)=?([^&]*)/g, store = {};
    let match;
    let haystack = window.location.search;

    haystack = haystack.substring (haystack.indexOf ("?") + 1, haystack.length);
    match = regex.exec (haystack);

    while (match) {
      store [decodeURIComponent (match [1])] = decodeURIComponent (match [2]);
      match = regex.exec (haystack);
    }

    return {
      /**
       * Returns the value corresponding to given key
       * @param {String} key - query param key
       * @returns {String} value - value from the store
       */
      get: (key) => {
        return store [key];
      }
    };
  };


  /**
   * Post message to the re-engagement iframe.
   * The origin of the iframe is same as that of the web chat.
   * Helper function to communicate with the sdk iframe using
   * postMessage. Stringifies the data before sending it.
   * @param {Element} iframe - target iframe element
   * @param {String} targetUrl - Target URL
   * @param {String} type - type of message
   * @param {Object} data - data for the message
   */
  const _postMessage = (iframe, targetUrl, type, data) => {
    iframe.contentWindow.postMessage (JSON.stringify ({
      type,
      data
    }), targetUrl);
  };

  /**
   * Convert passed object to query string format
   * @param {Object} obj - data for the XHR
   * @returns {String} - query string
   */
  const queryStringify = (obj) => {
    const qs = [];

    for (const key in obj) {
      if (obj.hasOwnProperty (key)) {
        qs.push (encodeURIComponent (key) + "=" + encodeURIComponent (obj [key]));
      }
    }
    return qs.join ("&");
  };

  /**
   * Function to make an XMLHttpRequest.
   * This method only supports the POST request as it's the only
   * type of XHR required on this page.
   * @param {params} Object - object holding XHR parameters
   * @param {params.url} String - URL for the XHR
   * @param {params.data} Object - Object holding that needs to be sent as payload
   * @param {params.onSucess} Function - Callback function to call when xhr is
   * successful.
   * @returns {XMLHttpRequest Object} xhr
   */
  const sendXhr = (params = {}) => {
    const xhr = new XMLHttpRequest ();
    let {data} = params;
    const {url, onSuccess} = params;
    const method = "POST";

    if (data) {
      data = queryStringify (data);
    }

    xhr.open (method, url, true);

    xhr.setRequestHeader ("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader ("X-Requested-With", "XMLHttpRequest");

    // Handling success callback only as the XHR is expected to fail silently
    xhr.onreadystatechange = function () {
      if ((xhr.readyState === 4) &&
          (xhr.status >= 200 && xhr.status < 300) &&
          onSuccess) {
        onSuccess (JSON.parse (xhr.responseText), xhr, xhr.status);
      }
    };

    xhr.send (data);
    return xhr;
  };

  /**
   * Fire XHR to get the re-engagement config.
   * @param {Object} data - Re-engagement config request params
   * @param {Function} onSuccess - Function to execute on success of XHR
   * @retruns {Object} XMLHttpRequest
   */
  const getReEnagementConfig = (data = {}, onSuccess) => {
    return sendXhr ({
      url: ENV_API_ROOT + GET_USER_CONFIG_URL,
      data,
      onSuccess
    });
  };

  /**
   * Create iframe for truncate_pid.hs.com
   * @param {String} src - Source of the iframe
   * @returns {Element} - re-engagement iframe
   */
  const createReEngagementIframe = (src) => {
    const iframe = document.createElement ("iframe");

    iframe.id = "hs-re-engagement-iframe";
    iframe.src = src;
    iframe.style.display = "none";
    return iframe;
  };

  /**
   * Initializes the redirection page
   * 1. @TODO: Shows the "redirecting to {channel_name}..." text
   * 2. Fires an XHR to get the config for re-engagement
   */
  const init = () => {
    let urlParams;

    // This is a workaround for IE & older versions of Safari.
    // If URLSearchParams constructor is not present then use
    // _localUrlSearchParams.
    if (URLSearchParams) {
      urlParams = new URLSearchParams (win.location.search);
    } else {
      urlParams = _localUrlSearchParams ();
    }

    const link = urlParams.get ("link");

    /*
     * Get re-engagement config from backend & on success of the XHR
     * create & append re-engagement iframe to the body.
     */
    getReEnagementConfig ({
      link
    }, (response) => {
      // On dev env, this gets replaced by a localhost URL.
      // See babel tasks in resources/gulp/javascript.js
      const WEB_CHAT_ROOT = "{{ENV_WEB_CHAT_ROOT}}";
      const urlParts = WEB_CHAT_ROOT.split ("://"),
            PROTOCOL = `${urlParts [0]}://`,
            PLAT_ID = response.pid,
            HOST = urlParts [1],
            PATH = "/html/re-engagement.html";

      // Truncate platform id to a fixed length (24 in this implementation).
      // Here's an example platform id - testdomain_platform_20170901110844149-0319dffe2b25f9c
      // Part 1 - First split plat id by "_platform_" and slice the first part by 8
      // chars -> get the first 8 chars of the domain. "testdoma" in this case.
      // Part 2 - Then slice the plat id from the end by 16 chars -> get a unique
      // part of the platform id. "-0319dffe2b25f9c" in this case.
      const TRUNCATED_PLAT_ID = PLAT_ID.split ("_platform_") [0].slice (0, 8) + PLAT_ID.slice (-16);

      const DOMAIN = `${PROTOCOL}${TRUNCATED_PLAT_ID}.${HOST}`;
      const IFRAME_SRC = `${DOMAIN}${PATH}`;

      const iframe = createReEngagementIframe (IFRAME_SRC);
      document.body.appendChild (iframe);

      win.addEventListener ("message", (ev) => {
        let type;

        try {
          const eventData = JSON.parse (ev.data);
          type = eventData.type;
        } catch (exception) {
          return;
        }

        if (type === SEND_LISTEN_MESSAGE_TYPES.IFRAME_LOADED) {
          // Post message to iframe with XHR response.
          // This will set the local storage values for the truncate_pid.hs.com
          _postMessage (iframe, IFRAME_SRC, SEND_LISTEN_MESSAGE_TYPES.SET_LS, response);
        } else if (type === SEND_LISTEN_MESSAGE_TYPES.SET_LS_DONE) {
          // If post message is successful then redirect to the brand's domain
          win.location.href = response.redirectionUrl;
        }
      }, false);
    });
  };

  // Initializes the redirection process
  init ();
}) (window);
