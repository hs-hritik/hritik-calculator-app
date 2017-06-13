/**
 * This file will load on the host page. It creates and appends the iframe
 * to the host page's document. It is responsible for communication between
 * the host and iframe. It also creates the Helpshift global object.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

(function (win, doc) {
  "use strict";

  win.Helpshift = {};

  // @TODO: Change it to use different url based on env
  const WEB_SDK_URL = "http://localhost:3000";

  /**
   * The event that the parent has to listen before calling Helpshift APIs.
   */
  const HS_SDK_LOAD_EVENT = "hs-sdk-load";

  const EVENT_TYPES = {
    SDK_JS_LOADED: "sdk-js-loaded",
    SDK_INITIALISED: "sdk-initialised",
    CMD_INITIALISE: "cmd-initialise",
    CMD_SET_USER: "cmd-set-user"
  };

  // @TODO: Figure out if we have to move styles to css file for this file,
  // or keep in javascript. Also update styles later.
  const LAUNCHER_IFRAME_STYLES = {
    "position": "fixed",
    "bottom": "20px",
    "right": "20px",
    "width": "60px",
    "height": "60px",
    "border-radius": "50%",
    "border-color": "#000000"
  };

  const LAUNCHER_BUTTON_WRAPPER_STYLES = {
    "position": "absolute",
    "top": 0,
    "left": 0,
    "width": "60px",
    "height": "60px",
    "background": "#1e90ff",
    "border-radius": "50%",
    "cursor": "pointer"
  };

  const MESSENGER_IFRAME_STYLES = {
    "position": "fixed",
    "bottom": "100px",
    "right": "20px",
    "border-color": "#000000"
  };

  // Reference for web sdk iframe.
  let webSdkIframe;

  /**
   * Util to set style for a given element.
   * @param {Element} el - The element to which styles have to be applied.
   * @param {Object} styles - key-value pair of styles to be applied.
   */
  const setStyle = (el, styles) => {
    for (const key in styles) {
      if (styles.hasOwnProperty (key)) {
        el.style [key] = styles [key];
      }
    }
  };

  /**
   * Post message to the iframe.
   * Helper function to communicate with the sdk iframe using
   * postMessage. Stringifies the data before sending it.
   * @param {String} type - type of message.
   * @param {Object} [data] - data for the message.
   */
  const _postMessage = (type, data) => {
    webSdkIframe.contentWindow.postMessage (JSON.stringify ({
      type,
      data
    }), WEB_SDK_URL);
  };

  /**
   * Create launcher iframe and set styles.
   * @returns {Element} - launcher iframe.
   */
  const createLauncherIframe = () => {
    const launcherIframe = doc.createElement ("iframe");
    setStyle (launcherIframe, LAUNCHER_IFRAME_STYLES);
    return launcherIframe;
  };

  /**
   * Create launcher button div and set styles.
   * @returns {Element} - launcher button div.
   */
  const createLauncherButton = () => {
    const launcherBtn = doc.createElement ("a");
    setStyle (launcherBtn, LAUNCHER_BUTTON_WRAPPER_STYLES);
    return launcherBtn;
  };

  /**
   * Create web sdk iframe.
   * @returns {Element} - web sdk iframe.
   */
  const createWebSdkIframe = () => {
    const iframe = doc.createElement ("iframe");
    setStyle (iframe, MESSENGER_IFRAME_STYLES);
    iframe.id = "hs-web-sdk-iframe";
    iframe.src = WEB_SDK_URL;
    return iframe;
  };

  /**
   * Show/hide web sdk iframe.
   */
  const toggleWebSdkIframe = () => {
    if (webSdkIframe.style.display === "none") {
      webSdkIframe.style.display = "block";
    } else {
      webSdkIframe.style.display = "none";
    }
  };

  /**
   * Fire event which represents that the web sdk is ready.
   * This event has to be consumed by parent page.
   * After this event is fired, parent can start communicating with
   * web sdk using APIs. If the parent tries to call APIs before this
   * event is fired, API won't work as expected (because sdk javascript has
   * not loaded yet or the sdk has not initialised yet.)
   */
  const fireWebSdkReadyEvent = () => {
    const event = new Event(HS_SDK_LOAD_EVENT);
    doc.dispatchEvent (event);
  };

  /**
   * Entry point for rendering iframe on the client page.
   */
  Helpshift.init = (config) => {
    const launcherIframe = createLauncherIframe (),
          launcherBtn = createLauncherButton ();

    doc.body.appendChild (launcherIframe);

    launcherBtn.addEventListener ("click", toggleWebSdkIframe);
    launcherIframe.contentDocument.body.appendChild (launcherBtn);

    webSdkIframe = createWebSdkIframe ();
    doc.body.appendChild (webSdkIframe);

    // Start listening for the iframe messages.
    win.addEventListener ("message", (event) => {
      const {type} = JSON.parse (event.data);

      switch (type) {
        case EVENT_TYPES.SDK_JS_LOADED:
          // SDK loading is separated into two parts: load and initialise.
          // SDK_JS_LOADED event represents that the web sdk's javascript is loaded.
          // Once the sdk's js has loaded, the sdk needs to be initialised with a config.
          // After the sdk has been initialised the parent page can use the api.
          _postMessage (EVENT_TYPES.CMD_INITIALISE, config);
          break;
        case EVENT_TYPES.SDK_INITIALISED:
          // SDK_INITIALISED event represents that the web sdk is initialised
          // with required config. Now parent can start calling Helpshift APIs.
          fireWebSdkReadyEvent ();
          break;
      }
    }, false);
  };

  /**
   * API to set user.
   * @param {String} id - user id.
   */
  Helpshift.setUser = (id) => {
    _postMessage (EVENT_TYPES.CMD_SET_USER, {
      id
    });
  };

}) (window, document);
