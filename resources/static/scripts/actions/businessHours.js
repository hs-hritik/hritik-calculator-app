/**
 * Business Hours Actions.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 3, 2017
 */

define ("actions/businessHours",
  [
    "constants/actionTypes",
    "actions/batch",
    "gunpowder/utils/schema"
  ],
  function (ACTION_TYPES, batchActions, schema) {
    "use strict";

    const {Input} = schema;

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
     * @param {Object} config - Config of formfield
     * @param {String} config.field - filed name of formfield
     * @param {String} config.value - value of formfield
     * @param {String} config.errorMsg - error message of formfield
     * @returns {Object} - Action
     */
    const setBusinessHoursContactFormDetails = (config) => {
      const {field, value, errorMsg} = config;
      return {
        type: ACTION_TYPES.SET_BUSINESS_HOURS_CONTACT_FORM_DETAILS,
        field,
        value,
        errorMsg
      };
    };

    /**
     * Return Array of action with formfield errors
     * @param {Object} businessHoursState - state of businessHours
     * @returns {Array} - Array of actions
     */
    const getContactFormErrors = (businessHoursState) => {
      const {contactFormDetails} = businessHoursState;
      const formErrors = [];

      for (const contactFormKey in contactFormDetails) {
        if (contactFormDetails.hasOwnProperty (contactFormKey)) {
          const formField = contactFormDetails [contactFormKey];

          if (formField.enabled) {
            const input = new Input (formField.value);
            const inputError = input.isValid ();

            if (inputError) {
              formErrors.push (
                setBusinessHoursContactFormDetails ({
                  field: contactFormKey,
                  errorMsg: inputError
                })
              );
            }
          }
        }
      }

      return formErrors;
    };

    /**
     * Action to save business hours contact form details
     */
    const submitBusinessHoursContactForm = () => {
      return (dispatch, getState) => {
        const state = getState ();
        const {businessHoursViewState} = state;
        const formErrors = getContactFormErrors (businessHoursViewState);

        if (formErrors.length) {
          dispatch (batchActions (formErrors));
          return;
        }
        // @TODO :- Fire xhr and save info
      };
    };

    return {
      setOutOfBusinessHours,
      setBusinessHoursContactFormDetails,
      submitBusinessHoursContactForm
    };
  }
);
