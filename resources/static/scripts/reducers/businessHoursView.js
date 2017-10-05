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
      outOfBusinessHours: false,
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
          return update (state, {
            // @TODO :- Verify name of key from backend
            // outOfBusinessHours: {$set: action.config.out_of_business_hours}
            // @NOTE :- Setting true for local testing
            outOfBusinessHours: {$set: true}
            // @TODO :- Add field's enabled property after backend integration
          });

        // @TODO :- Verify if this case is required
        case ACTION_TYPES.SET_OUT_OF_BUSINESS_HOURS:
          return (state, {
            outOfBusinessHours: {$set: action.enabled}
          });

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

        default:
          return state;
      }
    };
  }
);
