/**
 * UI helpers.
 * Contains helper methods for ui actions and ui config
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Dec 20, 2017
 */

define ("helpers/ui",
  [
    "constants/uiConfig"
  ],
  function (UI_CONFIG_CONSTANTS) {
    "use strict";

    const {DEFAULT_UI_CONFIG} = UI_CONFIG_CONSTANTS;

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
     * Return valid ui configs
     * @param {Object} uiConfig - object of ui config data
     * @returns {Object} - Object of ui config data
     */
    const getValidUIConfig = (uiConfig) => {
      const finalConfig = {};
      const sets = Object.keys (uiConfig);

      sets.forEach ((set) => {
        const setItems = Object.keys (uiConfig [set]);

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

          // @TODO :- Add 'value' validations here!
          if (VALID_CONFIG_KEYS.indexOf (configKey) !== -1) {
            const configValue = uiConfig [set] [setItem];

            finalConfig [configKey] = {
              key: configKey,
              value: configValue
            };
          }
        });
      });

      return finalConfig;
    };

    return {
      shadeColor,
      getValidUIConfig
    };
  }
);
