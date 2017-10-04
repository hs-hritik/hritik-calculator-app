/**
 * Business Hours Reducer.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 4, 2017
 */

define ("reducers/businessHoursView",
  [
    "constants/actionTypes"
  ],
  function (ACTION_TYPES) {
    "use strict";

    const update = React.addons.update;

    const INITIAL_STATE = {
      outOfBusinessHours: false,
      contactFormDetails: {
        name: {
          enabled: true,
          value: ""
        },
        email: {
          enabled: true,
          value: ""
        },
        message: {
          enabled: true,
          value: ""
        }
      }
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.SET_WM_CONFIG:
          return update (state, {
            // @TODO :- Verify name of key from backend
            // outOfBusinessHours: {$set: config.out_of_business_hours}
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
          return update (state, {
            contactFormDetails: {
              [action.field]: {
                value: {$set: action.value}
              }
            }
          });

        default:
          return state;
      }
    };
  }
);
