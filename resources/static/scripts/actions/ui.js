/**
 * UI Configurations Actions
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Dec 20, 2017
 */

define("actions/ui", ["constants/actionTypes", "helpers/ui"], function(ACTION_TYPES, uiHelpers) {
  "use strict";

  /**
   * Action to set UI configuration
   * @param {Object} hsUiConfig - helpshift UI config
   * @returns {Object} - Action
   */
  const setUiConfig = (hsUiConfig) => {
    const validUiConfig = uiHelpers.getValidUiConfig(hsUiConfig);

    return {
      type: ACTION_TYPES.SET_UI_CONFIG,
      uiConfig: validUiConfig
    };
  };

  /**
   * Action to update UI configuration
   * @param {Object} hsUiConfig - helpshift UI config
   * @returns {Object} - Action
   */
  const updateUiConfig = (hsUiConfig) => {
    const validUiConfig = uiHelpers.getValidUiConfig(hsUiConfig);

    return {
      type: ACTION_TYPES.UPDATE_UI_CONFIG,
      uiConfig: validUiConfig
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
    setUiConfig,
    updateUiConfig,
    setDeveloperUiConfig
  };
});
