/**
 * UI configuration related constants.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Dec 15, 2017
 */

define ("constants/uiConfig",
  function () {
    "use strict";

    const LAUNCHER_TEXT_COLOR = "#fff"; // white
    const PRIMARY_COLOR = "primary.color";
    const PRIMARY_COLOR_DARK = "primary.colorDark";
    const PRIMARY_COLOR_LIGHT = "primary.colorLight";

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
      ["primary.color", "--hs-primary-color", "#43BF6C"],
      ["primary.colorDark", "--hs-primary-color-dark", "#43BF6C"],
      ["primary.colorLight", "--hs-primary-color-light", "#43BF6C"],
      ["primary.font", "--hs-primary-font", ""]
    ];

    return {
      LAUNCHER_TEXT_COLOR,
      PRIMARY_COLOR,
      PRIMARY_COLOR_DARK,
      PRIMARY_COLOR_LIGHT,
      DEFAULT_UI_CONFIG
    };
  }
);
