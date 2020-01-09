/**
 * JS for re-engagement page
 * @author Aniket Hendre <aniket@helpshift.com>
 * @created Sep 10, 2018
 */

(function() {
  "use strict";

  const MESSAGE_TYPES = {
    CMD_SET_LS: "set-ls",
    SDK_SET_LS_DONE: "set-ls-done",
    SDK_IFRAME_LOADED: "iframe-loaded"
  };

  const LOCAL_STORAGE_KEYS = {
    REDIRECTED: "redirected",
    RE_ENGAGEMENT_DATA: "red"
  };
  const PARENT_URL = "{{ENV_WEB_CHAT_ROOT}}";

  /**
   * Post message to redirection.html page.
   * Helper function to communicate with the intermidiate
   * redirection.html  using postMessage. Stringifies the data before sending it.
   * @param {String} type - type of message
   * @param {Object} data - data for the message
   */
  const _postMessage = (type, data) => {
    window.parent.postMessage(
      JSON.stringify({
        type,
        data
      }),
      PARENT_URL
    );
  };

  window.addEventListener(
    "message",
    (ev) => {
      let type, data;

      try {
        const eventData = JSON.parse(ev.data);
        type = eventData.type;
        data = eventData.data;
      } catch (exception) {
        return;
      }

      if (type === MESSAGE_TYPES.CMD_SET_LS) {
        // Safari on iOS in private browsing mode doesn't behave well. It may or may
        // not throw and exception when using localstorage depending on the version
        // of the browser. Versions 11 and 12 fail silently without an exception.
        // Previous versions throw an exception that blocks further execution, thus
        // the user gets stuck on the redirection page.
        try {
          const ls = window.localStorage;
          ls.setItem(LOCAL_STORAGE_KEYS.REDIRECTED, true);
          ls.setItem(LOCAL_STORAGE_KEYS.RE_ENGAGEMENT_DATA, JSON.stringify(data));
        } catch (exception) {
          // @TODO: Report this exception to our servers, when the logging setup is done.
        } finally {
          _postMessage(MESSAGE_TYPES.SDK_SET_LS_DONE);
        }
      }
    },
    false
  );

  /* Iframe is loaded */
  _postMessage(MESSAGE_TYPES.SDK_IFRAME_LOADED);
})();
