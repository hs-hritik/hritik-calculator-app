/**
 * UI configuration related constants.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Dec 15, 2017
 */

define("constants/uiConfig", function() {
  "use strict";

  // Prefix used for derived keys
  const DERIVED_ID = "derived";

  // Colors map like we maintain in global scss
  const COLORS = {
    PRIMARY: "#453FB9",
    HIGHLIGHT: "rgba(0, 103, 244, .4)",
    TRANSPARENT: "transparent",
    BLACK: {
      BASE: "#576066",
      DARK: "#383F44",
      X_LIGHT: "#B6C3CC"
    },
    GRAY: {
      BASE: "#D4D7D9",
      LIGHT: "#E8E9EB",
      XX_LIGHT: "#FFFFFF",
      X_LIGHT: "#F8F9F9"
    },
    RED: {
      DARK: "#E65050"
    },
    YELLOW: {
      DARK: "#F2B230"
    }
  };

  /**
   * Flattened object keys of ui config object passed by developers
   * Example :
   *  uiCofig: {
   *   base: {
   *     color: "#0000ff",
   *     font: "arial"
   *   }
   *  }
   *  is flattened to -> "global.color", "global.font" and likewise
   * Here 'base' represents set and 'color' represents set item
   * @NOTE :- This config also contains derived keys which are computed w.r.t
   * some value. Example : Shades are computed based on base color.
   * Even if the developer pass the dervied value, it will be overwritten by
   * computed value.
   * Derived values are used for internal purpose and not meant be to
   * configured by developers.
   */
  const FLATTENED_UI_CONFIG = {
    // Base set
    BASE_COLOR: "global.color",
    BASE_FONT: "global.fontFamily",
    BASE_COLOR_DARK: `${DERIVED_ID}.global.colorDark`,
    BASE_COLOR_LIGHT: `${DERIVED_ID}.global.colorLightD`,
    BASE_FOCUS_RING_COLOR: "global.focusRingColor",

    // Initial Set (widget/launcher set)
    INITIAL_PRIMARY_BG_COLOR: "widgetFrame.primaryBgColor",
    INITIAL_SECONDARY_BG_COLOR: "widgetFrame.secondaryBgColor",
    INITIAL_PRIMARY_TEXT_COLOR: "widgetFrame.primaryTextColor",
    INITIAL_SECONDARY_TEXT_COLOR: "widgetFrame.secondaryTextColor",

    // Derived header css
    // @NOTE :- Header colors are specially derived colors as the their value is
    // dependant on multiple sets i.e a) primary set b) initial set
    HEADER_BG_COLOR: `${DERIVED_ID}.headerBgColor`,
    HEADER_TEXT_COLOR: `${DERIVED_ID}.headerTextColor`,

    // Chat widget set
    CHAT_WIDGET_BG_COLOR: "chatWidget.primaryBgColor",
    CHAT_WIDGET_PRIMARY_TEXT_COLOR: "chatWidget.primaryTextColor",
    CHAT_WIDGET_SECONDARY_TEXT_COLOR: "chatWidget.secondaryTextColor",
    CHAT_WIDGET_ACCENT_COLOR: "chatWidget.accentColor",
    CHAT_WIDGET_ACCENT_COLOR_LIGHT: `${DERIVED_ID}.chatWidget.accentColorLight`,
    CHAT_WIDGET_ERROR: "chatWidget.errorColor",

    // User message set
    USER_MESSAGE_BG_COLOR: "userBubble.primaryBgColor",
    USER_MESSAGE_BORDER_COLOR: "userBubble.borderColor",
    USER_MESSAGE_PRIMARY_TEXT_COLOR: "userBubble.primaryTextColor",
    USER_MESSAGE_ACCENT_COLOR: "userBubble.accentColor",
    USER_MESSAGE_ACCENT_COLOR_LIGHT: `${DERIVED_ID}.userBubble.accentColorLight`,
    USER_MESSAGE_ERROR: "userBubble.errorColor",

    // Agent message set
    AGENT_MESSAGE_BG_COLOR: "supportBubble.primaryBgColor",
    AGENT_MESSAGE_BORDER_COLOR: "supportBubble.borderColor",
    AGENT_MESSAGE_PRIMARY_TEXT_COLOR: "supportBubble.primaryTextColor",
    AGENT_MESSAGE_ACCENT_COLOR: "supportBubble.accentColor",
    AGENT_MESSAGE_ACCENT_COLOR_LIGHT: `${DERIVED_ID}.supportBubble.accentColorLight`,

    // Form set
    FORM_BG_COLOR: "form.primaryBgColor",
    FORM_SECONDARY_BG_COLOR: "form.secondaryBgColor",
    FORM_BORDER_COLOR: "form.borderColor",
    FORM_SECONDARY_BORDER_COLOR: "form.secondaryBorderColor",
    FORM_PRIMARY_TEXT_COLOR: "form.primaryTextColor",
    FORM_ACCENT_COLOR: "form.accentColor",
    FORM_ACCENT_COLOR_LIGHT: `${DERIVED_ID}.form.accentColorLight`,
    FORM_ERROR: "form.errorColor",

    // CSAT set
    CSAT_BG_COLOR: "csat.primaryBgColor",
    CSAT_ACCENT_COLOR: "csat.accentColor"
  };

  /**
   * DEFAULT_UI_CONFIG contains a mapping of developer config, css variable name
   * and value of the config.
   * 1. First value is string of flattened object keys that developer will pass in ui config.
   * 2. Second value is css variable name.
   * 3. Third value is the value of css variable.
   *    This will contain default values and developer values will be replaced here.
   * [config hierarchy (setName.uiConfigName), css variable name, value of variable]
   */
  const DEFAULT_UI_CONFIG = [
    [FLATTENED_UI_CONFIG.BASE_COLOR, "--hs-base-color", COLORS.PRIMARY],
    [FLATTENED_UI_CONFIG.BASE_COLOR_DARK, "--hs-base-color-dark", COLORS.PRIMARY],
    [FLATTENED_UI_CONFIG.BASE_COLOR_LIGHT, "--hs-base-color-light", COLORS.PRIMARY],
    [FLATTENED_UI_CONFIG.BASE_FONT, "--hs-base-font", ""],
    [FLATTENED_UI_CONFIG.BASE_FOCUS_RING_COLOR, "--hs-base-focus-ring-color", COLORS.HIGHLIGHT],
    [FLATTENED_UI_CONFIG.INITIAL_PRIMARY_BG_COLOR, "--hs-initial-primary-bg-color", COLORS.PRIMARY],
    [
      FLATTENED_UI_CONFIG.INITIAL_PRIMARY_TEXT_COLOR,
      "--hs-initial-primary-text-color",
      COLORS.GRAY.XX_LIGHT
    ],
    [
      FLATTENED_UI_CONFIG.INITIAL_SECONDARY_BG_COLOR,
      "--hs-initial-secondary-bg-color",
      COLORS.RED.DARK
    ],
    [
      FLATTENED_UI_CONFIG.INITIAL_SECONDARY_TEXT_COLOR,
      "--hs-initial-secondary-text-color",
      COLORS.GRAY.XX_LIGHT
    ],
    [FLATTENED_UI_CONFIG.HEADER_BG_COLOR, "--hs-header-bg-color", COLORS.PRIMARY],
    [FLATTENED_UI_CONFIG.HEADER_TEXT_COLOR, "--hs-header-text-color", COLORS.GRAY.XX_LIGHT],
    [FLATTENED_UI_CONFIG.CHAT_WIDGET_BG_COLOR, "--hs-chat-widget-bg-color", COLORS.GRAY.X_LIGHT],
    [
      FLATTENED_UI_CONFIG.CHAT_WIDGET_PRIMARY_TEXT_COLOR,
      "--hs-chat-widget-primary-text-color",
      COLORS.BLACK.DARK
    ],
    [
      FLATTENED_UI_CONFIG.CHAT_WIDGET_SECONDARY_TEXT_COLOR,
      "--hs-chat-widget-secondary-text-color",
      COLORS.BLACK.BASE
    ],
    [FLATTENED_UI_CONFIG.CHAT_WIDGET_ACCENT_COLOR, "--hs-chat-widget-accent-color", COLORS.PRIMARY],
    [
      FLATTENED_UI_CONFIG.CHAT_WIDGET_ACCENT_COLOR_LIGHT,
      "--hs-chat-widget-accent-color-light",
      COLORS.PRIMARY
    ],
    [FLATTENED_UI_CONFIG.CHAT_WIDGET_ERROR, "--hs-chat-widget-error", COLORS.RED.DARK],
    [FLATTENED_UI_CONFIG.USER_MESSAGE_BG_COLOR, "--hs-user-message-bg-color", COLORS.GRAY.XX_LIGHT],
    [
      FLATTENED_UI_CONFIG.USER_MESSAGE_BORDER_COLOR,
      "--hs-user-message-border-color",
      COLORS.GRAY.LIGHT
    ],
    [
      FLATTENED_UI_CONFIG.USER_MESSAGE_PRIMARY_TEXT_COLOR,
      "--hs-user-message-primary-text-color",
      COLORS.BLACK.BASE
    ],
    [
      FLATTENED_UI_CONFIG.USER_MESSAGE_ACCENT_COLOR,
      "--hs-user-message-accent-color",
      COLORS.PRIMARY
    ],
    [
      FLATTENED_UI_CONFIG.USER_MESSAGE_ACCENT_COLOR_LIGHT,
      "--hs-user-message-accent-color-light",
      COLORS.PRIMARY
    ],
    [FLATTENED_UI_CONFIG.USER_MESSAGE_ERROR, "--hs-user-message-error", COLORS.RED.DARK],
    [FLATTENED_UI_CONFIG.AGENT_MESSAGE_BG_COLOR, "--hs-agent-message-bg-color", COLORS.GRAY.LIGHT],
    [
      FLATTENED_UI_CONFIG.AGENT_MESSAGE_BORDER_COLOR,
      "--hs-agent-message-border-color",
      COLORS.TRANSPARENT
    ],
    [
      FLATTENED_UI_CONFIG.AGENT_MESSAGE_PRIMARY_TEXT_COLOR,
      "--hs-agent-message-primary-text-color",
      COLORS.BLACK.BASE
    ],
    [
      FLATTENED_UI_CONFIG.AGENT_MESSAGE_ACCENT_COLOR,
      "--hs-agent-message-accent-color",
      COLORS.PRIMARY
    ],
    [
      FLATTENED_UI_CONFIG.AGENT_MESSAGE_ACCENT_COLOR_LIGHT,
      "--hs-agent-message-accent-color-light",
      COLORS.PRIMARY
    ],
    [FLATTENED_UI_CONFIG.CSAT_BG_COLOR, "--hs-csat-bg-color", COLORS.BLACK.X_LIGHT],
    [FLATTENED_UI_CONFIG.CSAT_ACCENT_COLOR, "--hs-csat-accent-color", COLORS.YELLOW.DARK],
    [FLATTENED_UI_CONFIG.FORM_BG_COLOR, "--hs-form-bg-color", COLORS.GRAY.XX_LIGHT],
    [
      FLATTENED_UI_CONFIG.FORM_SECONDARY_BG_COLOR,
      "--hs-form-secondary-bg-color",
      COLORS.BLACK.X_LIGHT
    ],
    [FLATTENED_UI_CONFIG.FORM_BORDER_COLOR, "--hs-form-border-color", COLORS.GRAY.BASE],
    [
      FLATTENED_UI_CONFIG.FORM_SECONDARY_BORDER_COLOR,
      "--hs-form-secondary-border-color",
      COLORS.GRAY.LIGHT
    ],
    [
      FLATTENED_UI_CONFIG.FORM_PRIMARY_TEXT_COLOR,
      "--hs-form-primary-text-color",
      COLORS.BLACK.BASE
    ],
    [FLATTENED_UI_CONFIG.FORM_ACCENT_COLOR, "--hs-form-accent-color", COLORS.PRIMARY],
    [FLATTENED_UI_CONFIG.FORM_ACCENT_COLOR_LIGHT, "--hs-form-accent-color-light", COLORS.PRIMARY],
    [FLATTENED_UI_CONFIG.FORM_ERROR, "--hs-form-error", COLORS.RED.DARK]
  ];

  // Sets which has accent color
  const ACCENT_COLOR_SETS = ["CHAT_WIDGET", "USER_MESSAGE", "AGENT_MESSAGE", "FORM"];

  // Shades for colors
  const SHADES = {
    LIGHT_40: 0.4,
    LIGHT_20: 0.2,
    DARK_20: -0.2
  };

  return {
    DERIVED_ID,
    FLATTENED_UI_CONFIG,
    DEFAULT_UI_CONFIG,
    ACCENT_COLOR_SETS,
    SHADES
  };
});
