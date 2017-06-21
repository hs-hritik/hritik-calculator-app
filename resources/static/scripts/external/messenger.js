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
  // const WEB_SDK_URL = "https://hsmirkwood.helpshift.com/static/html/";
  const WEB_SDK_URL = "http://localhost:3000/static/html/";

  /**
   * The event that the parent has to listen before calling Helpshift APIs.
   */
  const HS_SDK_LOAD_EVENT = "hs-sdk-load";

  const EVENT_TYPES = {
    SDK_JS_LOADED: "sdk-js-loaded",
    SDK_INITIALISED: "sdk-initialised",
    SDK_ISSUES_LOADED: "sdk-issues-loaded",
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
    "border": "none",
    "box-shadow": "0 4px 32px rgba(0, 0, 0, .2)"
  };

  const LAUNCHER_BUTTON_WRAPPER_STYLES = {
    "position": "absolute",
    "top": 0,
    "left": 0,
    "width": "60px",
    "height": "60px",
    "background": "#f66",
    "border-radius": "50%",
    "cursor": "pointer",
    "box-sizing": "border-box",
    "padding": "12px 10px 8px"
  };

  const MESSENGER_IFRAME_STYLES = {
    "position": "fixed",
    "bottom": "100px",
    "right": "20px",
    "min-height": "520px",
    "max-height": "640px",
    "width": "340px",
    "border": "none",
    "border-radius": "8px",
    "z-index": "9999999",
    "box-shadow": "0 4px 32px rgba(0, 0, 0, .2)",
    "display": "none"
  };

  // const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
  //                       viewBox="0 0 560 560">
  //                       <polygon fill="#FFFFFF" fill-rule="evenodd"
  //                         points="470 127.997 432.003 90 280 242.003 127.997 90 90
  //                                 127.997 242.003 280 90 432.003 127.997 470 280 317.997
  //                                 432.003 470 470 432.003 317.997 280"/>
  //                     </svg>`;

  const MESSAGES_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
                          viewBox="0 0 560 560">
                          <g fill="#FFFFFF" fill-rule="evenodd" transform="translate(60 77)">
                            <path d="M363.373365,0 L10.16125,0 C5.42701923,0 0,3.96105769
                                    0,8.62971154 L0,235.205385 C0,239.872981 5.42701923,244.326923
                                    10.16125,244.326923 L70.8653846,244.326923
                                    L70.8653846,338.349423 L166.193077,244.326923
                                    L363.373365,244.326923 C368.108654,244.326923
                                    371.25,239.872981 371.25,235.205385
                                    L371.25,8.62971154 C371.25,3.96105769 368.107596,
                                    0 363.373365,0 L363.373365,0 Z"/>
                            <path d="M431.957308,66.6346154 L397.692308,66.6346154
                                    L397.692308,242.814423 C397.692308,259.72375
                                    390.378365,270.769231 371.089231,270.769231
                                    L179.909231,270.769231 L138.759712,312.019231
                                    L275.929712,312.019231 L371.25,406.153846
                                    L371.25,312.019231 L431.957308,312.019231
                                    C436.693654,312.019231 440,307.511346
                                    440,302.836346 L440,76.2627885 C440,71.5941346
                                    436.693654,66.6346154 431.957308,66.6346154
                                    L431.957308,66.6346154 Z"/>
                          </g>
                        </svg>`;

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
    // launcherBtn.innerHTML = "&#128172;";
    launcherBtn.innerHTML = MESSAGES_ICON;
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
      const {type, data} = JSON.parse (event.data);

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
        case EVENT_TYPES.SDK_ISSUES_LOADED:
          if (data.hasActiveIssue) {
            // @TODO: Show some indication to the user.
          }
          break;
      }
    }, false);
  };

  /**
   * API to set user.
   * @param {Object} user - user object. Contains id, name and email.
   */
  Helpshift.setUser = (user) => {
    _postMessage (EVENT_TYPES.CMD_SET_USER, {
      user
    });
  };

}) (window, document);
