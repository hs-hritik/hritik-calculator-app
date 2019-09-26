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

  const urlParts = WEB_CHAT_ROOT.split ("://"),
        PROTOCOL = `${urlParts [0]}://`,
        PLAT_ID = win.helpshiftConfig.platformId,
        HOST = urlParts [1],
        PATH = "/html/index.html?v=2.31.1";

  // Truncate platform id to a fixed length (24 in this implementation).
  // Here's an example platform id - testdomain_platform_20170901110844149-0319dffe2b25f9c
  // Part 1 - First split plat id by "_platform_" and slice the first part by 8
  // chars -> get the first 8 chars of the domain. "testdoma" in this case.
  // Part 2 - Then slice the plat id from the end by 16 chars -> get a unique
  // part of the platform id. "-0319dffe2b25f9c" in this case.
  const TRUNCATED_PLAT_ID = PLAT_ID.split ("_platform_") [0].slice (0, 8) + PLAT_ID.slice (-16);

  // @TODO: Rename WEB_SDK -> WEB_CHAT
  const WEB_SDK_DOMAIN = `${PROTOCOL}${TRUNCATED_PLAT_ID}.${HOST}`;

  // A query string with parent page's origin, which is later used with the
  // postMessage call by web chat to the parent page.
  const PARENT_ORIGIN_QUERY_STRING = `parent=${encodeURIComponent (win.location.origin)}`;

  // @TODO: Use `&` or `?` appropriately. PATH already contains hard-coded `?` so
  // it's safe to use `&` here but this must be made generic when `?` is removed.
  const WEB_SDK_URL = `${WEB_SDK_DOMAIN}${PATH}&${PARENT_ORIGIN_QUERY_STRING}`;

  const WIDGET_POSITIONS = {
    TOP_LEFT: "top-left",
    TOP_RIGHT: "top-right",
    BOTTOM_LEFT: "bottom-left",
    BOTTOM_RIGHT: "bottom-right"
  };

  // Local state managed by this script.
  const state = {
    unreadCount: 0,
    widgetOptions: {
      showLauncher: true,
      showCloseButton: true,
      fullScreen: false,
      position: WIDGET_POSITIONS.BOTTOM_RIGHT
    },
    cssConfig: {},
    apiEvents: [],
    webChatVisibility: {
      launcher: "block",
      widget: "none",
      hiddenByApi: false
    }
  };

  const INIT = "init";
  const FORCE_UPDATE_STYLES = true;
  // Time interval to wait for existence of document's body (in ms)
  const BODY_WAIT_TIMER = 500;

  // Event types for communication b/w client (this file) and the web chat app (the
  // iframe).
  // The events that are triggered by the client are prefixed with `CMD`
  // and the ones triggered by the web chat app with `SDK`. The events that come
  // from the web chat app (`SDK_..`) are handled below inside the `init` fn.
  // Events from the client (`CMD_..`) are sent to web chat via postMessage and
  // they are handled in api.js.
  const EVENT_TYPES = {
    SDK_JS_LOADED: "sdk-js-loaded",
    SDK_CONFIG_LOADED: "sdk-config-loaded",
    SDK_TOGGLE_MESSENGER: "sdk-toggle-messenger",
    SDK_RESET: "sdk-reset",
    SDK_UPDATE_UNREAD_COUNT: "sdk-update-unread-count",
    SDK_EVENT_CHAT_END: "sdk-event-chat-end",
    SDK_EVENT_CONVERSATION_START: "sdk-event-conversation-start",
    SDK_EVENT_CONVERSATION_END: "sdk-event-conversation-end",
    SDK_EVENT_CONVERSATION_REOPENED: "sdk-event-conversation-reopened",
    SDK_EVENT_CONVERSATION_RESOLVED: "sdk-event-conversation-resolved",
    SDK_EVENT_CONVERSATION_REJECTED: "sdk-event-conversation-rejected",
    SDK_EVENT_MESSAGE_ADD: "sdk-event-message-add",
    SDK_EVENT_CONVERSATION_STATUS: "sdk-event-conversation-status",
    SDK_UI_CONFIG_UPDATED: "sdk-ui-config-updated",
    SDK_EVENT_CSAT_SUBMIT: "sdk-event-csat-submit",
    SDK_UPDATE_UI_CONFIG_ERRORS: "sdk-update-ui-config-errors",
    SDK_USER_CHANGED_VIA_RE_ENGAGEMENT: "sdk-user-changed-via-re-engagement",
    CMD_MESSENGER_TOGGLED: "cmd-messenger-toggled",
    CMD_SET_CONFIG: "cmd-set-config",
    CMD_SET_INITIAL_USER_MESSAGE: "cmd-set-initial-user-message",
    CMD_SET_GREETING_MESSAGE: "cmd-set-greeting-message",
    CMD_SET_LANGUAGE: "cmd-set-language",
    CMD_SET_CIF: "cmd-set-cif",
    CMD_SET_METADATA: "cmd-set-metadata",
    CMD_REPLACE_CIF: "cmd-replace-cif",
    CMD_SET_EXEC_PROACTIVE_CHAT_RULES: "cmd-set-execute-proactive-chat-rules",
    CMD_UPDATE_UI_CONFIG: "cmd-update-ui-config",
    CMD_SET_FULL_PRIVACY: "cmd-set-full-privacy",
    CMD_UPDATE_HELPSHIFT_CONFIG: "cmd-update-helpshift-config"
  };

  /**
   * The name of the events that are exposed to the developers
   */
  const SUPPORTED_EVENTS = {
    CHAT_END: "chatEnd",
    CONVERSATION_START: "conversationStart",
    MESSAGE_ADD: "messageAdd",
    CSAT_SUBMIT: "csatSubmit",
    CONVERSATION_END: "conversationEnd",
    CONVERSATION_REOPENED: "conversationReopened",
    CONVERSATION_RESOLVED: "conversationResolved",
    CONVERSATION_REJECTED: "conversationRejected",
    NEW_UNREAD_MESSAGES: "newUnreadMessages",
    USER_CHANGED: "userChanged",
    WIDGET_TOGGLE: "widgetToggle",
    CONVERSATION_STATUS: "conversationStatus"
  };

  // Errors message strings
  const ERROR_MSG = {
    NO_API_NAME: "API name is not passed with the Helpshift call",
    API_NOT_SUPPORTED: "The API name passed with the Helpshift call is not supported",
    UI_CONFIG_ERROR_PREFIX: "HelpshiftUiConfigError: "
  };

  // A constant to indicate the source that triggered a function call, communication
  // b/w app and client, etc. For example, via API, user action, etc.
  const TRIGGER = {
    API: "API",
    RESET: "RESET"
  };

  // @TODO: Figure out if we have to move styles to css file for this file,
  // or keep in javascript. Also update styles later.
  const LAUNCHER_IFRAME_STYLES = {
    "position": "fixed",
    "bottom": "28px",
    "right": "28px",
    "width": "60px",
    "height": "60px",
    "z-index": "9999991",
    // @TODO: Add box shadow
    // "border-radius": "50%",
    // "box-shadow": "0 4px 32px rgba(0, 0, 0, .2)"
    "border": "none",
    "overflow": "hidden"
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
    // Final computed height = 100% (max 540px)
    //                        - 52px (header height)
    //                        - 53px (footer height = 52px input height + 1px border)
    "height": "calc(100% - 52px - 53px)",
    "width": "100%",
    "border": "none",
    "border-radius": "8px",
    "z-index": "9999999",
    "overflow":"hidden",
    "transform": "translate3d(0,0,0)",
    "box-shadow": "0 4px 32px rgba(0, 0, 0, .2)"
  };

  const MESSENGER_IFRAME_FULL_SCREEN_STYLES = {
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
    "z-index": "9999999"
  };

  const MESSENGER_IFRAME_WIDGET_SELECTOR_STYLES = {
    "position": "absolute",
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
    "z-index": "9999999"
  };

  const UNREAD_COUNT_STYLES = {
    "background-color": "#fa3e3e",
    "border-radius": "50%",
    "color": "white",
    "width": "20px",
    "height": "20px",
    "line-height": "20px",
    "text-align": "center",
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

  let CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
                        viewBox="0 0 560 560">
                        <polygon fill="#FFFFFF" fill-rule="evenodd"
                          points="470 127.997 432.003 90 280 242.003 127.997 90 90
                                  127.997 242.003 280 90 432.003 127.997 470 280 317.997
                                  432.003 470 470 432.003 317.997 280"/>
                      </svg>`;

  let MESSENGER_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
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
  let webSdkIframe, launcherBtn, unreadCountEl, launcherIconEl, launcherIframe,
      launcherButton, bodyTimer;

  // Api queue to save the apis and call them after sdk config is loaded
  let sdkLoaded = false;

  const parentPageInfo = {
    title: doc.title,
    url: win.location.href,
    origin: win.location.origin,
    width: Math.max (doc.documentElement.clientWidth, win.innerWidth || 0),
    height: Math.max (doc.documentElement.clientHeight, win.innerHeight || 0)
  };

  /**
   * Function to get the default value for registered event
   * @returns {Object}
   */
  const _getDefaultRegisteredEventValue = () => {
    return {
      eventHasOccured: false,
      data: null
    };
  };

  // The events which are called before event handler is registered
  // are stored in this register. The handler is called by checking
  // if event is already present in the register. If event is present
  // then call the handler with corresponding data and remove the event
  // from the register.
  // Following are the cases which should be considered for each new event:
  // 1. If developer doesn't want previous user data then we don't have
  // functionality in place to handle this scenario.
  // 2. If same event occurs multiple times then we override the existing
  // value with new value. We do not queue it.
  // 3. This doesn't consider time sensitive events. If this is required
  // then we need to think of functionality changes. Example: If we want
  // to notify developer for every new message by agent.
  const eventRegister = {
    [SUPPORTED_EVENTS.USER_CHANGED]: _getDefaultRegisteredEventValue ()
  };

  /**
   * Reset registered events value to default value.
   * @param {String} eventName
   */
  const resetRegisteredEvent = (eventName) => {
    eventRegister [eventName] = _getDefaultRegisteredEventValue ();
  };

  /**
   * Util to set style for a given element.
   * @param {Element} el - The element to which styles have to be applied.
   * @param {Object} styles - key-value pair of styles to be applied.
   */
  const setStyle = (el, styles) => {
    if (!el) {
      return;
    }
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
   * Util to remove a node from the DOM.
   * @param {HTMLElement} node - the node to be removed
   */
  const _removeNode = (node) => {
    node.parentNode.removeChild (node);
  };

  /**
   * Update the icon of the launcher button.
   * @param {String} icon - the icon that needs to be set
   */
  const updateLauncherBtnIcon = (icon) => {
    if (!launcherIframe) {
      return;
    }

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
    const iframe = doc.createElement ("iframe");
    setStyle (iframe, LAUNCHER_IFRAME_STYLES);

    // Update z-index of launcher if it was passed with helpshfitConfig
    if (typeof state.widgetOptions.zIndex === "number") {
      setStyle (iframe, {
        zIndex: state.widgetOptions.zIndex
      });
    }

    return iframe;
  };

  /**
   * Create launcher button div and set styles.
   * @returns {Element} - launcher button div.
   */
  const createLauncherButton = () => {
    launcherButton = doc.createElement ("a");
    launcherIconEl = doc.createElement ("span");
    launcherIconEl.innerHTML = MESSENGER_ICON;

    unreadCountEl = doc.createElement ("span");
    setStyle (unreadCountEl, UNREAD_COUNT_STYLES);
    renderUnreadCount ();

    launcherButton.appendChild (unreadCountEl);
    launcherButton.appendChild (launcherIconEl);

    launcherButton.addEventListener ("mouseenter", () => {
      setStyle (launcherButton, {
        background: state.cssConfig.launcherBgColorLight
      });
    });

    launcherButton.addEventListener ("mouseleave", () => {
      setStyle (launcherButton, {
        background: state.cssConfig.launcherBgColor
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
      _removeNode (webSdkIframe);
      webSdkIframe = null;
    }
  };

  /**
   * Destroy launcher iframe.
   */
  const destroyLauncherIframe = () => {
    if (launcherIframe) {
      _removeNode (launcherIframe);
      launcherIframe = null;
    }
  };

  /**
   * Show/hide web sdk iframe.
   * @param {Object} [config]
   * @param {boolean} [config.widgetShouldMinimize] - Explicitly minimize/maximize the iframe.
   * @param {boolean} [config.trigger] - Source for the function call - user action, api, etc.
   */
  const toggleWebSdkIframe = (config = {}) => {
    const widgetIsMinimized = webSdkIframe.style.display === "none";

    if (widgetIsMinimized === config.widgetShouldMinimize) {
      return;
    }

    if (widgetIsMinimized) {
      webSdkIframe.style.display = "block";
      state.webChatVisibility.widget = "block";
      updateLauncherBtnIcon (LAUNCHER_ICON.CLOSE);
    } else {
      webSdkIframe.style.display = "none";
      state.webChatVisibility.widget = "none";
      updateLauncherBtnIcon (LAUNCHER_ICON.MESSENGER);
    }

    callApiEventHandler ("widgetToggle", {
      visible: state.webChatVisibility.widget === "block"
    });

    // @NOTE - More info on SPA behavior :- https://tinyurl.com/yafecdkv
    // Toggle the visibility of launcher button when showCloseButton is set to false
    if (state.widgetOptions.showLauncher && !state.widgetOptions.showCloseButton) {
      // When the widget is opened, hide the launcher
      // If the widget is hidden, show the launcher again
      launcherBtn.style.display = state.webChatVisibility.widget === "block" ?
                                  "none" : "block";
    }

    _postMessage (EVENT_TYPES.CMD_MESSENGER_TOGGLED, {
      widgetHasMinimized: !widgetIsMinimized,
      trigger: config.trigger
    });
    renderUnreadCount ();
  };

  /**
   * Set sdk loaded as true and clear api queue
   */
  const markSdkReady = () => {
    sdkLoaded = true;
    clearApiQueue ();
  };

  /**
   * Update widget position
   */
  const updateWidgetPosition = () => {
    switch (state.widgetOptions.position) {
      case WIDGET_POSITIONS.BOTTOM_LEFT:
        LAUNCHER_IFRAME_STYLES.left = "28px";
        LAUNCHER_IFRAME_STYLES.right = "auto";

        MESSENGER_IFRAME_STYLES.left = "28px";
        MESSENGER_IFRAME_STYLES.right = "auto";

        UNREAD_COUNT_STYLES.left = "4px";
        UNREAD_COUNT_STYLES.right = "auto";
        break;

      case WIDGET_POSITIONS.TOP_LEFT:
        LAUNCHER_IFRAME_STYLES.top = "28px";
        LAUNCHER_IFRAME_STYLES.right = "auto";
        LAUNCHER_IFRAME_STYLES.bottom = "auto";
        LAUNCHER_IFRAME_STYLES.left = "28px";

        MESSENGER_IFRAME_STYLES.top = "100px";
        MESSENGER_IFRAME_STYLES.right = "auto";
        MESSENGER_IFRAME_STYLES.bottom = "auto";
        MESSENGER_IFRAME_STYLES.left = "28px";

        UNREAD_COUNT_STYLES.left = "4px";
        UNREAD_COUNT_STYLES.right = "auto";
        break;

      case WIDGET_POSITIONS.TOP_RIGHT:
        LAUNCHER_IFRAME_STYLES.top = "28px";
        LAUNCHER_IFRAME_STYLES.right = "28px";
        LAUNCHER_IFRAME_STYLES.bottom = "auto";
        LAUNCHER_IFRAME_STYLES.left = "auto";

        MESSENGER_IFRAME_STYLES.top = "100px";
        MESSENGER_IFRAME_STYLES.right = "28px";
        MESSENGER_IFRAME_STYLES.bottom = "auto";
        MESSENGER_IFRAME_STYLES.left = "auto";
        break;
    }
  };

  /**
   * Update launcher styles
   */
  const updateLauncherStyles = (forceUpdateStyles) => {
    const {
      launcherBgColor,
      launcherTextColor,
      notificationBgColor,
      notificationTextColor
    } = state.cssConfig;

    LAUNCHER_BUTTON_WRAPPER_STYLES.background = launcherBgColor;

    UNREAD_COUNT_STYLES.background = notificationBgColor;
    UNREAD_COUNT_STYLES.color = notificationTextColor;

    const colorRegEx = /fill=".+"\s/;
    const replaceValue = `fill="${launcherTextColor}" `;

    CLOSE_ICON = CLOSE_ICON.replace (colorRegEx, replaceValue);
    MESSENGER_ICON = MESSENGER_ICON.replace (colorRegEx, replaceValue);

    if (forceUpdateStyles) {
      setStyle (launcherButton, LAUNCHER_BUTTON_WRAPPER_STYLES);
      setStyle (unreadCountEl, UNREAD_COUNT_STYLES);
      const icon = webSdkIframe.style.display === "none" ?
                   LAUNCHER_ICON.MESSENGER : LAUNCHER_ICON.CLOSE;
      updateLauncherBtnIcon (icon);
    }
  };

  /**
   * Function to save required config options in local state
   * After config is processed, widget sends computed values to messenger js and
   * we have to save those latest computed values in state.
   * @param {Object} config
   */
  const saveConfigOptionsInState = (config) => {
    // CSS config options are computed by widget iframe depending on uiConfig
    state.cssConfig = config.cssConfig;
    // Full screen option is calculated by widget iframe depending on screens
    // resolution
    state.widgetOptions.fullScreen = config.fullScreen;
  };

  /**
   * Function to return widget selector DOM
   * Checks if widget selector is passed in helpshfitConfig
   * and returns the DOM element else returns null
   * @returns {(HTMLElement|null)} - Widget selector
   */
  const getWidgetSelector = () => {
    const widgetSelector = win.helpshiftConfig.widgetSelector;
    return widgetSelector && doc.querySelector (widgetSelector) || null;
  };

  /**
   * Update web sdk and launcher iframe style
   * @param {Object} config
   */
  const updateIframeStyles = (config) => {
    // Set styles for launcher iframe
    updateLauncherStyles ();
    updateWidgetPosition ();

    // Set styles for websdk iframe
    const webchatContainer = getWidgetSelector ();
    if (webchatContainer) {
      setStyle (webSdkIframe, MESSENGER_IFRAME_WIDGET_SELECTOR_STYLES);
    } else if (config.fullScreen) {
      setStyle (webSdkIframe, MESSENGER_IFRAME_FULL_SCREEN_STYLES);
    } else {
      setStyle (webSdkIframe, MESSENGER_IFRAME_STYLES);
    }

    // Update z-index of the web chat iframe if it was passed with helpshfitConfig
    // The client (via helpshiftConfig) can set the z-index value of the launcher
    // iframe. We derive the z-index value for the chat widget iframe by incrementing
    // it by a number. Incrementing by 10, the choice of number doesn't make much
    // of a difference.
    if (typeof state.widgetOptions.zIndex === "number") {
      setStyle (webSdkIframe, {
        zIndex: state.widgetOptions.zIndex + 10
      });
    }
  };

  /**
   * Process web chat config to update the behavior of the widget.
   * Also, let Web Chat know that it can proceed with its flow.
   * @param {Object} - the config object
   */
  const processWmConfig = (config) => {
    // If web chat is not enabled, destroy the iframes.
    if (!config.widgetEnabled) {
      destroyWebSdkIframe ();
      destroyLauncherIframe ();
      return;
    }

    saveConfigOptionsInState (config);
    updateIframeStyles (config);

    const launcherHidden = !state.widgetOptions.showLauncher;
    // If the launcher iframe is hidden by the widget config options
    // then mark sdk as ready
    if (launcherHidden) {
      markSdkReady ();
    }

    // If launcher is hidden or launcher iframe is already created then
    // don't create launcherIframe
    if (launcherHidden || launcherIframe) {
      return;
    }

    // If the widget is enabled, create the launcher iframe+button and append
    // it to the document.
    launcherIframe = createLauncherIframe ();

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

      markSdkReady ();

      // If widgetShouldAutoOpen is true then dispatch message to open
      // the widget.
      if (config.widgetShouldAutoOpen) {
        toggleWebSdkIframe ({
          widgetShouldMinimize: false
        });
      }
    };

    doc.body.appendChild (launcherIframe);
  };

  /**
   * Post message to set app configuration
   */
  const setConfig = (data) => {
    _postMessage (EVENT_TYPES.CMD_SET_CONFIG, data);
  };

  /**
   * Check if the given API is supported
   * @param {String} api - the API name string
   * @returns {Boolean}
   */
  const isApiValid = (api) => {
    return typeof helpshiftApis [api] === "function";
  };

  /**
   * Get APIs queued with the global Helpshift function defined in the embed
   * script.
   * @returns {Array} - List of functions for APIs bound with the arguments.
   */
  const getQueuedApis = () => {
    // The window.Helpshift function defined in the embed script contains a
    // static queue used to store the API calls made by client side JavaScript.
    // For each item of the queue, add an item (a function bound with the API's
    // arguments) to the list to return.
    const HS = win.Helpshift;
    const validApiQueue = [];

    if (HS && Array.isArray (HS.q) && HS.q.length) {
      HS.q.forEach ((queuedArgs) => {
        // Convert arguments to an array.
        // For V8 optimization reasons, using a for loop here, instead of slicing
        // the arguments to make a new array.
        // For details, check the following -
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
        // https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
        const queuedArgsLen = queuedArgs.length;
        const args = [];
        for (let i = 0; i < queuedArgsLen; i++) {
          args.push (queuedArgs [i]);
        }

        // The array args contains the API name ("open", "addEventListener", etc)
        // as the first item. Rest of the items of the args array are the arguments
        // that the API should execute with.
        const api = args [0];
        const apiArgs = args.slice (1);

        if (isApiValid (api)) {
          const apiFn = helpshiftApis [api];
          // Concatenating apiArgs with null in order to specify the context of
          // the bound function (null).
          validApiQueue.push (apiFn.bind.apply (apiFn, [null].concat (apiArgs)));
        }
      });
    }

    return validApiQueue;
  };

  /**
   * Execute every queued api and clear the api queue
   */
  const clearApiQueue = () => {
    apiQueue.forEach ((fn) => {
      if (typeof fn === "function") {
        fn ();
      }
    });
    apiQueue = [];
  };

  /**
   * Return whether web sdk is supported or not
   * Check for browser features that web sdk uses
   */
  const isWebSdkSupported = () => {
    let supported = true;

    // Check for local storage
    // Add try-catch as reading localStorage property throws an error if
    // localStorage is disabled
    try {
      supported = !!win.localStorage &&
                  typeof localStorage.getItem === "function" &&
                  typeof localStorage.setItem === "function" &&
                  typeof localStorage.removeItem === "function";
    } catch (exception) {
      // @TODO :- Add analytics events for exceptions/failures
      supported = false;
    }

    return supported;
  };

  /**
   * Function to set default launcher visibility
   * The default visibility of launcher is also dependant on showLauncher widget
   * option passed by developers.
   */
  const setDefaultLauncherVisibility = () => {
    state.webChatVisibility.launcher = state.widgetOptions.showLauncher ?
                                       "block" : "none";
  };

  /**
   * Function to update the widget (web chat iframe's) styles
   */
  const updateWidgetStyles = () => {
    const {
      widgetOptions: {
        showLauncher,
        showCloseButton
      }
    } = state;

    // If show launcher is false or show close button is false then move the
    // widget below its original position to have equal space from edge.
    if (!showLauncher || !showCloseButton) {
      // @NOTE - We are modifying the style in style constant as opposed to using
      // setStyle method because the launcher is not present at this point in time.
      // Also changing the constant will not have side effect as it expected behavior.
      MESSENGER_IFRAME_STYLES.bottom = "28px";
    }
  };

  /**
   * Process widget options and save them in state
   */
  const processWidgetOptions = () => {
    const options = window.helpshiftConfig.widgetOptions || {};

    if (typeof options.showLauncher === "boolean") {
      state.widgetOptions.showLauncher = options.showLauncher;
    }

    if (typeof options.showCloseButton === "boolean") {
      state.widgetOptions.showCloseButton = options.showCloseButton;
    }

    if (typeof options.fullScreen === "boolean") {
      state.widgetOptions.fullScreen = options.fullScreen;
    }

    if (typeof options.position === "string") {
      state.widgetOptions.position = options.position;
    }

    if (typeof options.zIndex === "number") {
      state.widgetOptions.zIndex = options.zIndex;
    }
  };

  /**
   * Log ui config errors on console
   * @param {Array} errors - list of errors
   */
  const logUiConfigErrors = (errors) => {
    const prefix = ERROR_MSG.UI_CONFIG_ERROR_PREFIX;

    errors.forEach ((error) => {
      const {set, value, info} = error;
      const setText = "Set = " + set;
      const valueText = value ? " | Value = " + value : "";
      const infoText = " | Info = " + info;

      /* eslint-disable no-console */
      console.error (prefix + setText + valueText + infoText);
      /* eslint-enable no-console */
    });
  };

  /**
   * Function to find the event name in the event list and call its handler.
   * If eventName is not found within event list then add it in eventRegister.
   * @param {String} eventName - Name of the event
   * @param {Any} eventData - Data for the event
   */
  const callApiEventHandler = (eventName, eventData) => {
    let handlerIsFound = false;

    state.apiEvents.forEach ((apiEvent) => {
      if (apiEvent.eventName === eventName) {
        apiEvent.eventHandler (eventData);
        handlerIsFound = true;
      }
    });

    // Add event to the eventRegister if the handler is not found.
    // The event handler will be called when developer calls the
    // addEventListener Helpshift API for this event.
    if (!handlerIsFound && !eventRegister [eventName]) {
      eventRegister [eventName] = {
        eventHasOccured: true,
        data: eventData
      };
    }
  };

  /**
   * JS API to initialize messenger.
   * Entry point for rendering iframe on the client page.
   */
  const init = () => {
    // Check for existence of document body, if body is not present, wait and
    // try again in sometime
    if (!document || !document.body) {
      bodyTimer = setTimeout (init, BODY_WAIT_TIMER);
      return;
    }

    if (bodyTimer) {
      clearTimeout (bodyTimer);
    }

    // If browser features required to run web chat isn't available on this
    // browser OR
    // if a web chat iframe already exists on the host web page,
    // no-op and return.
    const webChatIframe = doc.getElementById ("hs-web-sdk-iframe");
    if (!isWebSdkSupported () || webChatIframe) {
      return;
    }

    processWidgetOptions ();
    updateWidgetStyles ();

    setDefaultLauncherVisibility ();

    webSdkIframe = createWebSdkIframe ();

    const webchatContainer = getWidgetSelector ();

    if (webchatContainer) {
      webchatContainer.appendChild (webSdkIframe);
    } else {
      doc.body.appendChild (webSdkIframe);
    }

    // Start listening to the iframe's messages.
    win.addEventListener ("message", (event) => {
      // Only handle events from our web chat iframes (old and new)
      if (event.origin !== WEB_SDK_DOMAIN) {
        return;
      }

      let type, data;

      try {
        const eventData = JSON.parse (event.data);
        type = eventData.type;
        data = eventData.data;
      } catch (exception) {
        return;
      }

      switch (type) {
        case EVENT_TYPES.SDK_JS_LOADED:
          // Before the Web Chat APIs can be called by the client, following
          // events should occur (in the given order).
          //
          // SDK_JS_LOADED: Represents the execution completion of the Web Chat
          // entry point (webSdk.js).
          // SDK_CONFIG_LOADED: Represents the loading of the web chat BE
          // config, which along with other settings, determines whether
          // the widget should load or not.

          // Pass client config and parent page info to set initial app data.
          // Also, pass the localStorage data to migrate. Passing this with setConfig
          // in order to avoid another asynchronous postMessage call to the web
          // chat iframe.
          setConfig ({
            clientConfig: win.helpshiftConfig,
            parentPageInfo
          });
          break;

        case EVENT_TYPES.SDK_USER_CHANGED_VIA_RE_ENGAGEMENT:
          callApiEventHandler (SUPPORTED_EVENTS.USER_CHANGED, data.userInfo);
          break;

        case EVENT_TYPES.SDK_CONFIG_LOADED:
          // Process wm config to set appearance, etc.
          processWmConfig (data.wmConfig);
          break;

        case EVENT_TYPES.SDK_TOGGLE_MESSENGER:
          toggleWebSdkIframe ({
            widgetShouldMinimize: data.minimized
          });
          break;

        case EVENT_TYPES.SDK_UPDATE_UNREAD_COUNT:
          state.unreadCount = data.count;
          renderUnreadCount ();

          // Call the event handler for new unread messages event if
          // web chat iframe is not open
          if (webSdkIframe.style.display === "none") {
            callApiEventHandler (SUPPORTED_EVENTS.NEW_UNREAD_MESSAGES, {
              unreadCount: data.count
            });
          }
          break;

        case EVENT_TYPES.SDK_RESET:
          // Reset unread count of the local state and re-render
          state.unreadCount = 0;
          renderUnreadCount ();

          // Call `setConfig` which will ultimately create a preissue and/or
          // start the poller.
          setConfig ({
            clientConfig: win.helpshiftConfig,
            parentPageInfo,
            trigger: TRIGGER.RESET
          });
          break;

        case EVENT_TYPES.SDK_EVENT_CHAT_END:
          // Call the event handler for chat end event.
          callApiEventHandler (SUPPORTED_EVENTS.CHAT_END);
          break;

        case EVENT_TYPES.SDK_EVENT_CONVERSATION_START:
          // Call the event handler for conversation start event.
          callApiEventHandler (SUPPORTED_EVENTS.CONVERSATION_START, {
            message: data.message
          });
          break;

        case EVENT_TYPES.SDK_EVENT_CONVERSATION_END:
          // Call the event handler for conversation end event.
          callApiEventHandler (SUPPORTED_EVENTS.CONVERSATION_END);
          break;

        case EVENT_TYPES.SDK_EVENT_CONVERSATION_REOPENED:
          // Call the event handler for conversation reopened event.
          callApiEventHandler (SUPPORTED_EVENTS.CONVERSATION_REOPENED);
          break;

        case EVENT_TYPES.SDK_EVENT_CONVERSATION_RESOLVED:
          // Call the event handler for conversation resolved event.
          callApiEventHandler (SUPPORTED_EVENTS.CONVERSATION_RESOLVED);
          break;

        case EVENT_TYPES.SDK_EVENT_CONVERSATION_REJECTED:
          // Call the event handler for conversation rejected event.
          callApiEventHandler (SUPPORTED_EVENTS.CONVERSATION_REJECTED);
          break;

        case EVENT_TYPES.SDK_EVENT_MESSAGE_ADD:
          // Call the event handler for add message
          callApiEventHandler (SUPPORTED_EVENTS.MESSAGE_ADD, {
            type: data.type,
            body: data.body
          });
          break;

        case EVENT_TYPES.SDK_EVENT_CSAT_SUBMIT:
          // Call the event handler for csat submit event.
          callApiEventHandler (SUPPORTED_EVENTS.CSAT_SUBMIT, {
            rating: data.rating,
            additionalFeedback: data.review
          });
          break;

        case EVENT_TYPES.SDK_EVENT_CONVERSATION_STATUS:
          // Call the event handler for conversation status event
          callApiEventHandler (SUPPORTED_EVENTS.CONVERSATION_STATUS, data);
          break;

        case EVENT_TYPES.SDK_UI_CONFIG_UPDATED:
          state.cssConfig = data.cssConfig;
          updateLauncherStyles (FORCE_UPDATE_STYLES);
          break;

        case EVENT_TYPES.SDK_UPDATE_UI_CONFIG_ERRORS:
          logUiConfigErrors (data.errors);
          break;
      }
    }, false);
  };

  /**
   * JS API to open/maximize/show the messenger widget
   */
  const open = () => {
    if (!state.webChatVisibility.hiddenByApi) {
      toggleWebSdkIframe ({
        widgetShouldMinimize: false,
        trigger: TRIGGER.API
      });
    }
  };

  /**
   * JS API to close/minimize/hide the messenger widget
   */
  const close = () => {
    if (!state.webChatVisibility.hiddenByApi) {
      toggleWebSdkIframe ({
        widgetShouldMinimize: true,
        trigger: TRIGGER.API
      });
    }
  };

  /**
   * JS API to hide webchat
   * This will hide the launcher and widget completely
   *
   * @NOTE - css visibility has nothing to do with this. Although the name is
   * visibility, we are saving the display property in state.
   */
  const hide = () => {
    // Save current visibility of webchat (launcher + widget) in state
    // Check for showLauncher widget option as existence of launcher button is
    // dependant on it
    // If the launcher button is already hidden, don't do anything
    if (state.widgetOptions.showLauncher && launcherBtn.style.display !== "none") {
      state.webChatVisibility.launcher = launcherBtn.style.display;
      launcherBtn.style.display = "none";
    }

    // If the webSdkIframe iframe is already hidden, don't do anything
    if (webSdkIframe.style.display !== "none") {
      state.webChatVisibility.widget = webSdkIframe.style.display;
      webSdkIframe.style.display = "none";
    }

    state.webChatVisibility.hiddenByApi = true;
  };

  /**
   * JS API to show webchat
   * This will restore the visibility of the launcher and widget
   */
  const show = () => {
    // Restore the previous display properties of webchat (launcher + widget)
    webSdkIframe.style.display = state.webChatVisibility.widget;

    // Check for showLauncher widget option as existence of launcher button is
    // dependant on it
    if (state.widgetOptions.showLauncher) {
      launcherBtn.style.display = state.webChatVisibility.launcher;
    }

    state.webChatVisibility.hiddenByApi = false;
  };

  /**
   * JS API to set initial end user message
   * @param {String} message - initial user message
   */
  const setInitialUserMessage = (message) => {
    // message should be non-empty string
    if (typeof message === "string" && message.trim ()) {
      _postMessage (EVENT_TYPES.CMD_SET_INITIAL_USER_MESSAGE, {
        message,
        trigger: TRIGGER.API
      });
    }
  };

  /**
   * JS API to set greeting message
   * @param {String} message - greeting message
   */
  const setGreetingMessage = (message) => {
    // message should be a non-empty string
    if (message && typeof message === "string") {
      _postMessage (EVENT_TYPES.CMD_SET_GREETING_MESSAGE, {message});
    }
  };

  /**
   * JS API to set language
   * @param {String} language - language ISO Code
   */
  const setLanguage = (language) => {
    if (language && typeof language === "string") {
      _postMessage (EVENT_TYPES.CMD_SET_LANGUAGE, {language});
    }
  };

  /**
   * Returns boolean if event name is supported
   * @param {String} eventName - name of event
   * @returns {Boolean} - whether event name is supported
   */
  const isEventSupported = (eventName) => {
    for (const event in SUPPORTED_EVENTS) {
      if (SUPPORTED_EVENTS [event] === eventName) {
        return true;
      }
    }
    return false;
  };

  /**
   * JS API to add supported events
   * @param {String} eventName - name of event
   * @param {Function} eventHandler - event handler
   */
  const addEventListener = (eventName, eventHandler) => {
    // If event name is supported, add that event
    if (isEventSupported (eventName) && eventHandler) {
      state.apiEvents.push ({
        eventName,
        eventHandler
      });

      // If event has already occured for the current event
      // then call the handler with the registered data.
      // Reset the event in register once the handler is called.
      const registeredEvent = eventRegister [eventName];
      if (registeredEvent && registeredEvent.eventHasOccured) {
        callApiEventHandler (eventName, registeredEvent.data);
        resetRegisteredEvent (eventName);
      }
    }
  };

  /**
   * JS API to remove supported events
   * @param {String} eventName - name of event
   * @param {Function} eventHandler - event handler
   */
  const removeEventListener = (eventName, eventHandler) => {
    // If event name is supported, remove that event
    if (isEventSupported (eventName) && eventHandler) {
      state.apiEvents = state.apiEvents.filter ((apiEvent) => {
        return !(apiEvent.eventName === eventName &&
                 apiEvent.eventHandler === eventHandler);
      });
    }
  };

  /**
   * Return true if given item is object
   * @param {Object} item - object to validate
   * @returns {Boolean} - whether item is object
   */
  const isObject = (item) => {
    return (typeof item === "object" && !Array.isArray (item) && item !== null);
  };

  /**
   * Return processed data containing cif object which contains only type and value
   * @param {Object} cifData - data of cif
   * @returns {Object} - processed cif data
   */
  const getProcessedCifData = (cifData) => {
    const processedCif = {};

    if (!isObject (cifData)) {
      return processedCif;
    }

    for (const cifItem in cifData) {
      if (cifData.hasOwnProperty (cifItem)) {
        const cif = cifData [cifItem];

        if (isObject (cif) &&
            typeof cif.type === "string" &&
            !!cif.type &&
            typeof cif.value !== "undefined") {
          processedCif [cifItem] = {
            type: cif.type,
            value: cif.value
          };
        }
      }
    }

    return processedCif;
  };

  /**
   * Set custom issue fields
   * @param {Object} cifData - cif data
   */
  const setCustomIssueFields = (cifData) => {
    _postMessage (EVENT_TYPES.CMD_SET_CIF, {
      cifData: getProcessedCifData (cifData)
    });
  };

  /**
   * Set custom meta data
   * @param {Object} metaData - meta data object
   */
  const setCustomMetadata = (metadata) => {
    if (metadata && isObject (metadata)) {
      _postMessage (EVENT_TYPES.CMD_SET_METADATA, {
        metadata
      });
    }
  };

  /**
   * Replace custom issue fields
   * @param {Object} cifData - cif data
   */
  const replaceCustomIssueFields = (cifData) => {
    _postMessage (EVENT_TYPES.CMD_REPLACE_CIF, {
      cifData: getProcessedCifData (cifData)
    });
  };

  /**
   * Handle proactive chat rules API
   * @param {Object} data
   * @param {Object} data.proactiveChatRules - An object with conditions and
   *                 actions for proactive chat
   */
  const setProactiveChatRules = (proactiveChatRules) => {
    _postMessage (EVENT_TYPES.CMD_SET_EXEC_PROACTIVE_CHAT_RULES, {
      proactiveChatRules
    });
  };

  /**
   * JS API to update ui config
   * @param {Object} uiConfig - ui config
   */
  const updateUiConfig = (uiConfig) => {
    _postMessage (EVENT_TYPES.CMD_UPDATE_UI_CONFIG, {
      uiConfig
    });
  };

  /**
   * JS API to enable/disable full privacy mode.
   */
  const setFullPrivacy = (enabled = false) => {
    _postMessage (EVENT_TYPES.CMD_SET_FULL_PRIVACY, {
      enabled
    });
  };

  /**
   * JS API to update helpshift config
   * This api will be called by the developers when they get the config data at
   *  later point after the parent page is loaded.
   */
  const updateHelpshiftConfig = () => {
    _postMessage (EVENT_TYPES.CMD_UPDATE_HELPSHIFT_CONFIG);
  };

  // A map with all the supported APIs. The global Helpshift () call looks
  // into this map to get the definition of the called API.
  const helpshiftApis = {
    init,
    open,
    close,
    setInitialUserMessage,
    setGreetingMessage,
    setLanguage,
    addEventListener,
    removeEventListener,
    setCustomIssueFields,
    setCustomMetadata,
    replaceCustomIssueFields,
    setProactiveChatRules,
    updateUiConfig,
    setFullPrivacy,
    updateHelpshiftConfig,
    hide,
    show
  };

  // Append the APIs to the local apiQueue variable in order to execute them
  // after the SDK is loaded.
  let apiQueue = getQueuedApis ();

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

    // If a] sdk is loaded OR b] the API is init or update, then directly call
    // the API
    // Else queue the API in sequence and call them after SDK config is loaded
    // Note :- Allowing init API because it's the first API that will be called
    if (sdkLoaded || api === INIT) {
      // Call the Helpshift api with the arguments
      helpshiftApis [api].apply (null, apiArguments);
    } else if (isApiValid (api)) {
      // Queue the API, if it's valid
      apiQueue.push (helpshiftApis [api].bind (null, ...apiArguments));
    }
  };
}) (window, document);
