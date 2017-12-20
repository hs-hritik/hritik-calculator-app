/**
 * UI Configurations Actions
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Dec 20, 2017
 */

define ("actions/ui",
  [
    "constants/actionTypes",
    "helpers/ui"
  ],
  function (ACTION_TYPES, uiHelpers) {
    "use strict";

    /**
     * Action to set UI configuration
     * @param {Object} hsUIConfig - helpshift UI config
     * @returns {Object} - Action
     */
    const setUIConfig = (hsUIConfig) => {
      const validUIConfig = uiHelpers.getValidUIConfig (hsUIConfig);

      return {
        type: ACTION_TYPES.SET_UI_CONFIG,
        uiConfig: validUIConfig
      };
    };

    return {
      setUIConfig
    };
  }
);
