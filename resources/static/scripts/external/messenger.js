/**
 * This file will load on the host page. It creates and appends the iframe
 * to the host page's document. It is responsible for communication between
 * the host and iframe. It also creates the Helpshift global object.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

(function (win, doc) {
  "use strict";

  // On dev env, this gets replaced by a localhost URL.
  // See babel tasks in resources/gulp/javascript.js
  const WEB_CHAT_ROOT = "{{ENV_WEB_CHAT_ROOT}}";
  const WEB_SDK_URL = `${WEB_CHAT_ROOT}/html`;

  const state = {
    unreadCount: 0,
    cssConfig: {}
  };

  /**
   * The event that the parent has to listen before calling Helpshift APIs.
   */
  const HS_SDK_LOAD_EVENT = "hs-sdk-load";
  const INIT = "init";

  const EVENT_TYPES = {
    SDK_JS_LOADED: "sdk-js-loaded",
    SDK_INITIALISED: "sdk-initialised",
    SDK_CONFIG_LOADED: "sdk-config-loaded",
    SDK_TOGGLE_MESSENGER: "sdk-toggle-messenger",
    SDK_RESET: "sdk-reset",
    UPDATE_UNREAD_COUNT: "update-unread-count",
    CMD_MESSENGER_TOGGLED: "cmd-messenger-toggled",
    CMD_INITIALISE: "cmd-initialise",
    CMD_SET_CONFIG: "cmd-set-config",
    CMD_RESET: "cmd-reset"
  };

  // Errors message strings
  const ERROR_MSG = {
    NO_API_NAME: "API name is not passed with the Helpshift call",
    API_NOT_SUPPORTED: "The API name passed with the Helpshift call is not supported"
  };

  // @TODO: Figure out if we have to move styles to css file for this file,
  // or keep in javascript. Also update styles later.
  const LAUNCHER_IFRAME_STYLES = {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    width: "60px",
    height: "60px",
    // @TODO: Add box shadow
    // "border-radius": "50%",
    // "box-shadow": "0 4px 32px rgba(0, 0, 0, .2)"
    border: "none",
    overflow: "hidden"
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
    "right": "28px",
    "min-height": "320px",
    "max-height": "540px",
    "min-width": "320px",
    "max-width": "340px",
    "height": "100%",
    "width": "100%",
    "border": "none",
    "border-radius": "8px",
    "z-index": "9999999",
    "overflow":"hidden",
    "box-shadow": "0 4px 32px rgba(0, 0, 0, .2)",
    "display": "none"
  };

  const MESSENGER_IFRAME_MOBILE_STYLES = {
    "position": "fixed",
    "top": "0px",
    "left": "0px",
    "bottom": "0px",
    "right": "0px",
    "width": "100%",
    "height": "100%",
    "border": "none",
    "margin": 0,
    "padding": 0,
    "overflow": "hidden",
    "z-index": 999999,
    "display": "none"
  };

  const UNREAD_COUNT_STYLES = {
    "background-color": "#fa3e3e",
    "border-radius": "50%",
    "color": "white",
    "padding": "2px 6px",
    "font-size": "12px",
    "position": "absolute",
    "top": "0px",
    "right": "4px",
    "font-family": "sans-serif"
  };

  const LAUNCHER_ICON = {
    CLOSE: "CLOSE",
    MESSENGER: "MESSENGER"
  };

  const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
                        viewBox="0 0 560 560">
                        <polygon fill="#FFFFFF" fill-rule="evenodd"
                          points="470 127.997 432.003 90 280 242.003 127.997 90 90
                                  127.997 242.003 280 90 432.003 127.997 470 280 317.997
                                  432.003 470 470 432.003 317.997 280"/>
                      </svg>`;

  const MESSENGER_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
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
  let webSdkIframe, launcherBtn, unreadCountEl, launcherIconEl;

  // Api queue to save the apis and call them after sdk config is loaded
  let sdkLoaded = false,
      apiQueue = [];

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
   * Update the icon of the launcher button.
   * @param {String} icon - the icon that needs to be set
   */
  const updateLauncherBtnIcon = (icon) => {
    if (icon === LAUNCHER_ICON.CLOSE) {
      launcherIconEl.innerHTML = CLOSE_ICON;
      // Due the the size and geometry of the close icon, update the
      // padding of the container element.
      setStyle (launcherBtn, {
        padding: "16px"
      });
    } else {
      launcherIconEl.innerHTML = MESSENGER_ICON;
      setStyle (launcherBtn, {
        padding: "12px 10px 8px"
      });
    }
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
    const launcherButton = doc.createElement ("a");
    launcherIconEl = doc.createElement ("span");
    launcherIconEl.innerHTML = MESSENGER_ICON;

    unreadCountEl = doc.createElement ("span");
    setStyle (unreadCountEl, UNREAD_COUNT_STYLES);
    renderUnreadCount ();

    launcherButton.appendChild (unreadCountEl);
    launcherButton.appendChild (launcherIconEl);

    launcherButton.addEventListener ("mouseenter", () => {
      setStyle (launcherButton, {
        background: state.cssConfig.primaryColorLight
      });
    });

    launcherButton.addEventListener ("mouseleave", () => {
      setStyle (launcherButton, {
        background: state.cssConfig.primaryColor
      });
    });

    setStyle (launcherButton, LAUNCHER_BUTTON_WRAPPER_STYLES);
    return launcherButton;
  };

  /**
   * Render the unread count badge.
   */
  const renderUnreadCount = () => {
    if (!unreadCountEl) {
      return;
    }
    if (state.unreadCount !== 0 && webSdkIframe.style.display === "none") {
      unreadCountEl.innerHTML = state.unreadCount;
      setStyle (unreadCountEl, {
        display: "inline"
      });
    } else {
      unreadCountEl.innerHTML = "";
      setStyle (unreadCountEl, {
        display: "none"
      });
    }
  };

  /**
   * Create web sdk iframe.
   * @returns {Element} - web sdk iframe.
   */
  const createWebSdkIframe = () => {
    const iframe = doc.createElement ("iframe");
    iframe.id = "hs-web-sdk-iframe";
    iframe.src = WEB_SDK_URL;
    setStyle (iframe, {
      display: "none"
    });
    return iframe;
  };

  /**
   * Destroy web sdk iframe.
   */
  const destroyWebSdkIframe = () => {
    if (webSdkIframe) {
      webSdkIframe.parentNode.removeChild (webSdkIframe);
      webSdkIframe = null;
    }
  };

  /**
   * Show/hide web sdk iframe.
   * @param {Object} [config]
   * @param {Boolean} [config.minimized] - Explicitly minimize/maximize the iframe.
   */
  const toggleWebSdkIframe = (config = {}) => {
    const currentlyMinimized = webSdkIframe.style.display === "none";

    if (currentlyMinimized === config.minimized) {
      return;
    }

    if (currentlyMinimized) {
      webSdkIframe.style.display = "block";
      updateLauncherBtnIcon (LAUNCHER_ICON.CLOSE);
    } else {
      webSdkIframe.style.display = "none";
      updateLauncherBtnIcon (LAUNCHER_ICON.MESSENGER);
    }

    _postMessage (EVENT_TYPES.CMD_MESSENGER_TOGGLED, {
      minimized: !currentlyMinimized
    });
    renderUnreadCount ();
  };

  /**
   * Fire event which represents that the web sdk is ready.
   * This event has to be consumed by parent page.
   * After this event is fired, parent can start communicating with
   * web sdk using APIs. If the parent tries to call APIs before this
   * event is fired, API won't work as expected (because sdk JavaScript has
   * not loaded yet or the sdk has not initialised yet.)
   */
  const fireWebSdkReadyEvent = () => {
    const event = new Event(HS_SDK_LOAD_EVENT);
    doc.dispatchEvent (event);
  };

  /**
   * Process web messenger config to update the behavior of the widget.
   * @param {Object} - the config object
   */
  const processWmConfig = (config) => {
    // @TODO: Use the web messenger config to set appearance, etc.
    state.cssConfig = config.cssConfig;
    LAUNCHER_BUTTON_WRAPPER_STYLES.background = state.cssConfig.primaryColor;

    if (!config.widgetEnabled) {
      destroyWebSdkIframe ();
      return;
    }
    // If the widget is enabled, create the launcher iframe+button and append
    // it to the document.
    const launcherIframe = createLauncherIframe ();

    // Append the buttons to iframe once it is loaded.
    // Note: Even though the iframe doesn't have any src, if we try to append
    // the launcher button before the onload event is triggered,
    // the launcher button doesn't get appended on firefox.
    // (Works fine on chrome without onload event)
    launcherIframe.onload = () => {
      // Append meta tag to iframe's head.
      const metaTag = doc.createElement ("meta");
      metaTag.setAttribute ("charset", "utf-8");
      launcherIframe.contentDocument.head.appendChild (metaTag);

      // Append launcher button to iframe's body.
      launcherBtn = createLauncherButton ();
      launcherBtn.addEventListener ("click", () => {
        toggleWebSdkIframe ();
      });
      launcherIframe.contentDocument.body.appendChild (launcherBtn);

      // Apply styles for webSdkIframe
      if (config.browserIsMobile) {
        setStyle (webSdkIframe, MESSENGER_IFRAME_MOBILE_STYLES);
      } else {
        setStyle (webSdkIframe, MESSENGER_IFRAME_STYLES);
      }

      // Set sdk loaded as true
      sdkLoaded = true;
      // Clear the api queue
      clearApiQueue ();
    };

    doc.body.appendChild (launcherIframe);
  };

  /**
   * Post message to set config.
   */
  const setConfig = (config) => {
    _postMessage (EVENT_TYPES.CMD_SET_CONFIG, config);
  };

  /**
   * Execute every queued api and clear the api queue
   */
  const clearApiQueue = () => {
    apiQueue.forEach ((fn) => fn ());
    apiQueue = [];
  };

  /**
   * JS API to initialize messenger.
   * Entry point for rendering iframe on the client page.
   */
  const init = () => {
    webSdkIframe = createWebSdkIframe ();
    doc.body.appendChild (webSdkIframe);

    // Start listening to the iframe's messages.
    win.addEventListener ("message", (event) => {
      // @TODO Event origin domain check should also be added. As something else
      // besides the Helpshift sdk, maybe the client's own code, can trigger
      // window.onmessage which will throw error if data is of not the required
      // format.
      const {type, data} = JSON.parse (event.data);

      switch (type) {
        case EVENT_TYPES.SDK_JS_LOADED:
          // Before web messenger APIs can be called by the client, following
          // events should occur (in the given order).
          //
          // SDK_JS_LOADED: Represents the execution completion of the web sdk
          // entry point (webSdk.js).
          // SDK_CONFIG_LOADED: Represents the loading of web messenger
          // config, which along with other settings, determines whether
          // the widget should load or not.
          // SDK_INITIALISED: Represents the loading of the wm React app.

          // Set the client and wm configs to the app.
          setConfig (window.helpshiftConfig);
          break;

        case EVENT_TYPES.SDK_CONFIG_LOADED:
          // Process wm config to set appearance, etc.
          processWmConfig (data.wmConfig);
          break;

        case EVENT_TYPES.SDK_INITIALISED:
          fireWebSdkReadyEvent ();
          break;

        case EVENT_TYPES.SDK_TOGGLE_MESSENGER:
          toggleWebSdkIframe ({
            minimized: data.minimized
          });
          break;

        case EVENT_TYPES.UPDATE_UNREAD_COUNT:
          state.unreadCount = data.count;
          renderUnreadCount ();
          break;

        case EVENT_TYPES.SDK_RESET:
          close ();
          setConfig (window.helpshiftConfig);
          break;
      }
    }, false);
  };

  /**
   * JS API to open/maximize/show the messenger widget
   */
  const open = () => {
    toggleWebSdkIframe ({
      minimized: false
    });
  };

  /**
   * JS API to close/minimize/hide the messenger widget
   */
  const close = () => {
    toggleWebSdkIframe ({
      minimized: true
    });
  };

  /**
   * JS API to reset the conversation
   */
  const reset = () => {
    _postMessage (EVENT_TYPES.CMD_RESET);
  };

  // A map with all the supported APIs. The global Helpshift () call looks
  // into this map to get the definition of the called API.
  const helpshiftApis = {
    init,
    open,
    close,
    reset
  };

  /**
   * The global Helpshift function to handle the APIs. It relies on the
   * following invocation pattern.
   *
   * // Call the addMessage api
   * Helpshift ("addMessage", apiArguments)
   * where addMessage is the name of the API and apiArguments is the argument
   * that is further passed to the api call.
   *
   * The number of arguments passed to this function may vary depending on which
   * API is called. The API should throw exception(s) based on its requirements.
   */
  win.Helpshift = function (api, ...apiArguments) {
    if (typeof api !== "string") {
      // Throw an error back to the client if an API is not called
      throw new Error (ERROR_MSG.NO_API_NAME);
    } else if (typeof helpshiftApis [api] !== "function") {
      // Throw an error if the API is not supported
      throw new Error (ERROR_MSG.API_NOT_SUPPORTED);
    }

    // If a] sdk is loaded OR b] the api is init, then directly call the apis
    // else queue the apis in sequence and call them after sdk config is loaded
    // Note :- allowing init api because it's the first api that will be called
    if (sdkLoaded || api === INIT) {
      // Call the Helpshift api with the arguments
      helpshiftApis [api].apply (null, apiArguments);
    } else {
      // Queue the apis
      apiQueue.push (helpshiftApis [api].bind (null, apiArguments));
    }
  };
}) (window, document);
