/**
 * UI helpers.
 * Contains helper methods for ui actions and ui config
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Dec 20, 2017
 */

define ("helpers/ui",
  [
    "constants/uiConfig",
    "utils/color",
    "utils/dataType",
    "extras/postSdkMessage"
  ],
  function (UI_CONFIG_CONSTANTS, colorUtils, dataTypeUtils, postSdkMessage) {
    "use strict";

    const {
      DEFAULT_UI_CONFIG,
      FLATTENED_UI_CONFIG: {
        BASE_FONT
      }
    } = UI_CONFIG_CONSTANTS;
    const {isHexColor} = colorUtils;

    // First column of DEFAULT_UI_CONFIG contains the allowed keys
    const VALID_CONFIG_KEYS = DEFAULT_UI_CONFIG.map ((config) => config [0]);

    /**
     * Lighten or darken the given color.
     * Usage example:
     *  - To lighten a color by 10%
     *    shadeColor ("#123456", 0.1)
     *  - To darken a color by 10%
     *    shadeColor ("#123456", -0.1)
     * Taken from: https://stackoverflow.com/a/13542669/3785351
     * @param {String} color - The string of the color which has to be lighten or darken.
     *                         Only hex is supported. (# must be passed in the beginning.)
     * @param {Number} shadeFactor - Between -1 to 1. To darken the color, give negative value.
     *                               To lighten the color, give positive value.
     */
    const shadeColor = (color, shadeFactor) => {
      // Remove #
      color = color.slice (1);
      // If color length is 3, change it to 6
      if (color.length === 3) {
        color = color [0] + color [0] + color [1] + color [1] + color [2] + color [2];
      }

      const f = parseInt (color, 16),
            t = shadeFactor < 0 ? 0 : 255,
            p = shadeFactor < 0 ? shadeFactor * -1 : shadeFactor,
            R = f >> 16,
            G = f >> 8 & 0x00FF,
            B = f & 0x0000FF;

      return "#" +
        (0x1000000 + (Math.round ((t - R) * p) + R) *
         0x10000 + (Math.round ((t - G) * p) + G) *
         0x100 + (Math.round ((t - B) * p) + B)
        ).toString (16).slice (1);
    };

    /**
     * Predicate to validate font family
     * @param {Any} fontFamily - font family set by developer
     */
    const isFontFamilyValid = (fontFamily) => {
      // Font family is valid if
      // 1] It is a string
      // 2] It does NOT have trailing comma
      // 3] It does NOT contain semi colon
      return (typeof fontFamily === "string" &&
              fontFamily.charAt (fontFamily.length - 1) !== "," &&
              fontFamily.indexOf (";") === -1);
    };

    /**
     * Return valid ui configs
     * @param {Object} uiConfig - object of ui config data
     * @returns {Object} - Object of ui config data
     */
    const getValidUIConfig = (uiConfig) => {
      const finalConfig = {};
      const sets = Object.keys (uiConfig);
      const uiConfigErrors = [];

      sets.forEach ((set) => {
        const uiConfigSet = uiConfig [set];

        if (!dataTypeUtils.isObject (uiConfigSet)) {
          uiConfigErrors.push ({
            set: set,
            value: (typeof uiConfigSet),
            info: "Set has an invalid value"
          });
          return;
        }

        const setItems = Object.keys (uiConfigSet);
        setItems.forEach ((setItem) => {
          /**
           * Config key is derived by flattening 'set' and 'set item' of ui config.
           * Example :-
           * helpshiftConfig: {
           *  // uiConfig is param to this function
           *  uiConfig: {
           *    // 'primary' is the set
           *    primary: {
           *      // 'color' is the set item & 'red' is the value
           *      color: "red"
           *    }
           *  }
           * }
           * is converted as configKey = "primary.color" and configValue = "red"
          */
          const configKey = `${set}.${setItem}`;

          if (VALID_CONFIG_KEYS.indexOf (configKey) !== -1) {
            const configValue = uiConfig [set] [setItem];

            if (configKey === BASE_FONT) {
              // Validate if font family is valid
              if (isFontFamilyValid (configValue)) {
                finalConfig [configKey] = {
                  key: configKey,
                  value: configValue
                };
              } else {
                uiConfigErrors.push ({
                  set: configKey,
                  value: configValue,
                  info: "Value is not a valid font family"
                });
              }
            } else if (isHexColor (configValue)) {
              // Validate if the config value is hex value
              finalConfig [configKey] = {
                key: configKey,
                value: configValue
              };
            } else {
              uiConfigErrors.push ({
                set: configKey,
                value: configValue,
                info: "Value is not a hex color value"
              });
            }
          } else {
            uiConfigErrors.push ({
              set: configKey,
              info: "Set is not valid"
            });
          }
        });
      });

      if (uiConfigErrors.length) {
        postSdkMessage.uiConfigErrors (uiConfigErrors);
      }

      return finalConfig;
    };

    return {
      shadeColor,
      getValidUIConfig
    };
  }
);
