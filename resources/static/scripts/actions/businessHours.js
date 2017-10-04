/**
 * Business Hours Actions.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 3, 2017
 */

define ("actions/businessHours",
  [
    "constants/actionTypes"
  ],
  function (ACTION_TYPES) {
    "use strict";

    /**
     * Action to set out of business hours boolean
     * @param {Boolean} enabled - business hours enabled
     * @returns {Object} - Action
     */
    // @TODO :- Verify if this action is required
    const setOutOfBusinessHours = (enabled) => {
      return {
        type: ACTION_TYPES.SET_OUT_OF_BUSINESS_HOURS,
        enabled
      };
    };

    /**
     * Action to set business hours contact form details
     * @param {String} field - Name of formfield
     * @param {String} value - value of formfield
     * @returns {Object} - Action
     */
    const setBusinessHoursContactFormDetails = (field, value) => {
      return {
        type: ACTION_TYPES.SET_BUSINESS_HOURS_CONTACT_FORM_DETAILS,
        field,
        value
      };
    };

    /**
     * Action to save business hours contact form details
     */
    const submitBusinessHoursContactForm = () => {
      // @TODO :- Fire xhr and save the user info
    };

    return {
      setOutOfBusinessHours,
      setBusinessHoursContactFormDetails,
      submitBusinessHoursContactForm
    };
  }
);
