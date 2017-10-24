/**
 * Business Hours Actions.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 3, 2017
 */

define ("actions/businessHours",
  [
    "store",
    "constants/actionTypes",
    "constants/routes",
    "actions/chatView",
    "actions/actionCreators",
    "actions/batch",
    "helpers/xhr",
    "gunpowder/utils/schema",
    "gunpowder/utils/xhr",
    "extras/postSdkMessage",
    "utils/browser"
  ],
  function (store, ACTION_TYPES, routes, chatViewActions, actionCreators, batchActions,
    xhrHelpers, schema, xhr, postSdkMessage, browserUtils) {
    "use strict";

    const {Input} = schema;

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
     * Action to set issue created flag as true
     * @returns {Object} - Action
     */
    const setBusinessHoursFormSubmitted = () => {
      return {
        type: ACTION_TYPES.SET_BUSINESS_HOURS_FORM_SUBMITTED
      };
    };

    /**
     * Action to set business hours form enabled
     * @returns {Object} - Action
     */
    const enableBusinessHoursContactForm = () => {
      return {
        type: ACTION_TYPES.ENABLE_BUSINESS_HOURS_CONTACT_FORM
      };
    };

    /**
     * Action to set business hours form disabled
     * @returns {Object} - Action
     */
    const disableBusinessHoursContactForm = () => {
      return {
        type: ACTION_TYPES.DISABLE_BUSINESS_HOURS_CONTACT_FORM
      };
    };

    /**
     * Fetch data & creates issue on occurance of corresponding event.
     */
    const fetchDataForIssueCreation = () => {
      postSdkMessage.getParentInfo ();
    };

    /**
     * Create issue for out of business hour
     * @param {Function} dispatch - dispatch
     * @param {Object} state - state
     */
    const createIssue = (config) => {
      const {id, platformId, message, inBusinessHours, tags, cif, domain,
             onSuccess, onEnd} = config;

      const {appState} = store.getState ();
      const {metadata} = appState;

      const xhrData = {
        "identifier": id,
        "platform-id": platformId,
        "message-body": message,
        "in_business_hours": inBusinessHours,
        "language": browserUtils.getLanguage ()
      };

      const meta = {
        device_info: metadata
      };

      if (tags) {
        meta.custom_meta = {
          "hs-tags": tags
        };
      }
      xhrData.meta = JSON.stringify (meta);

      // If cif is set and contains atleast one field, add to xhr data
      if (cif && Object.keys (cif).length) {
        xhrData.custom_fields = JSON.stringify (cif);
      }

      xhr ({
        route: routes.postIssue (domain),
        method: "POST",
        data: xhrData,
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess,
        onEnd
      });
    };

    /**
     * This action gets called asynchronously from api.js, when parent data
     * required for issue creation is available.
     */
    const registerUserAndCreateIssue = () => {
      return (dispatch, getState) => {
        const state = getState ();
        const {businessHoursViewState, appState} = state;
        const {contactFormDetails} = businessHoursViewState;

        chatViewActions.registerUserProfile ({
          identifier: appState.identifier,
          name: contactFormDetails.name.value.value,
          email: contactFormDetails.email.value.value
        },
        appState.domain, {
          onSuccess: (response) => {
            // @TODO :- Create a util for firing xhrs.
            // Move registerUserProfile from chatViewActions to util
            // Remove createIssue method from here and from chat view actions
            const profileId = response ["profile-id"];
            const {tags, cif} = appState;
            const message = contactFormDetails.message.value.value;

            dispatch (actionCreators.setUserProfileId (profileId));
            createIssue ({
              id: response.identifier,
              platformId: appState.platformId,
              domain: appState.domain,
              message,
              inBusinessHours: businessHoursViewState.inBusinessHours,
              tags,
              cif,
              onSuccess: () => {
                dispatch (setBusinessHoursFormSubmitted ());
              },
              onEnd: () => {
                dispatch (enableBusinessHoursContactForm ());
              }
            });
          }
        });
      };
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

        dispatch (disableBusinessHoursContactForm ());
        // Get parent data & create issue
        fetchDataForIssueCreation ();
      };
    };

    return {
      setBusinessHoursContactFormDetails,
      submitBusinessHoursContactForm,
      registerUserAndCreateIssue
    };
  }
);
