/**
 * Business Hours Reducer.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 4, 2017
 */

define ("reducers/businessHoursView",
  [
    "constants/actionTypes",
    "constants/businessHoursView"
  ],
  function (ACTION_TYPES, BUSINESS_HOURS_CONSTANTS) {
    "use strict";

    const update = React.addons.update;
    const {NAME, EMAIL, MESSAGE} = BUSINESS_HOURS_CONSTANTS.CONTACT_FORM_FIELDS;

    const INITIAL_STATE = {
      businessHoursEnabled: false,
      inBusinessHours: true,
      offlineBehaviour: "",
      contactFormDisabled: false,
      contactFormSubmitted: false,
      contactFormDetails: {
        name: {
          enabled: true,
          value: {
            name: NAME,
            value: "",
            validations: ["required"]
          }
        },
        email: {
          enabled: true,
          value: {
            name: EMAIL,
            value: "",
            validations: ["required", "email"]
          }
        },
        message: {
          enabled: true,
          value: {
            name: MESSAGE,
            value: "",
            validations: ["required"]
          }
        }
      }
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.SET_WM_CONFIG:
          const businessHoursEnabled = action.config.business_hours_enabled;
          const updateObject = {
            businessHoursEnabled: {$set: businessHoursEnabled},
            inBusinessHours: {$set: action.config.in_business_hours}
          };

          if (businessHoursEnabled) {
            const businessHours = action.config.business_hours;
            updateObject.offlineBehaviour = {$set: businessHours.offline_behavior};

            updateObject.contactFormDetails = {
              name: {
                enabled: {$set: businessHours.cf_fields.name}
              },
              email: {
                enabled: {$set: businessHours.cf_fields.email}
              },
              message: {
                enabled: {$set: businessHours.cf_fields.message}
              }
            };
          }

          return update (state, updateObject);

        case ACTION_TYPES.SET_BUSINESS_HOURS_CONTACT_FORM_DETAILS:
          const valueUpdateObj = {};

          if (action.hasOwnProperty ("value")) {
            valueUpdateObj.value = {$set: action.value};
          }

          if (action.hasOwnProperty ("errorMsg")) {
            valueUpdateObj.errorMsg = {$set: action.errorMsg};
          }

          return update (state, {
            contactFormDetails: {
              [action.field]: {
                value: valueUpdateObj
              }
            }
          });

        case ACTION_TYPES.ENABLE_BUSINESS_HOURS_CONTACT_FORM:
          return update (state, {
            contactFormDisabled: {$set: false}
          });

        case ACTION_TYPES.DISABLE_BUSINESS_HOURS_CONTACT_FORM:
          return update (state, {
            contactFormDisabled: {$set: true}
          });

        case ACTION_TYPES.SET_BUSINESS_HOURS_FORM_SUBMITTED:
          return update (state, {
            contactFormSubmitted: {$set: true}
          });

        default:
          return state;
      }
    };
  }
);
