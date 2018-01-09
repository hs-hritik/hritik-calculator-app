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

    /**
     * Action to update UI configuration
     * @param {Object} hsUIConfig - helpshift UI config
     * @returns {Object} - Action
     */
    const updateUIConfig = (hsUIConfig) => {
      const validUIConfig = uiHelpers.getValidUIConfig (hsUIConfig);

      return {
        type: ACTION_TYPES.UPDATE_UI_CONFIG,
        uiConfig: validUIConfig
      };
    };

    /**
     * Action to set developer ui config
     * @param {Object} uiConfig - developer ui config
     * @returns {Object} - Action
     */
    const setDeveloperUiConfig = (uiConfig) => {
      return {
        type: ACTION_TYPES.SET_DEVELOPER_UI_CONFIG,
        uiConfig
      };
    };

    return {
      setUIConfig,
      updateUIConfig,
      setDeveloperUiConfig
    };
  }
);
