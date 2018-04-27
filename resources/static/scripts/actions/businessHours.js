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
    "gunpowder/utils/object",
    "extras/postSdkMessage",
    "utils/browser",
    "utils/upload"
  ],
  function (store, ACTION_TYPES, routes, chatViewActions, actionCreators, batchActions,
    xhrHelpers, schema, xhr, objectUtils, postSdkMessage, browserUtils, upload) {
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
     * @returns {Function} - Action
     */
    const createIssueOutOfBusinessHours = () => {
      return (dispatch, getState) => {
        const {
          appState: {
            domain,
            metadata,
            tags,
            cif,
            fullPrivacyEnabled,
            developerSetLanguage
          },
          businessHoursViewState: {
            contactFormDetails: {
              attachmentsMeta,
              attachments,
              message,
              name,
              email
            },
            inBusinessHours
          }
        } = getState ();
        const messageValue = message.value.value;
        let attachmentFiles = null;

        if (attachmentsMeta.featureIsEnabled && attachments.length) {
          attachmentFiles = attachments.map (({file}) => file);
        }

        const xhrData = {
          "message-body": messageValue,
          "email": email.value.value,
          "in_business_hours": inBusinessHours,
          "device_language": browserUtils.getLanguage ()
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

        if (name.enabled) {
          xhrData.name = name.value.value;
        }

        // If cif is set and contains atleast one field, add to xhr data
        if (cif && Object.keys (cif).length) {
          xhrData.custom_fields = JSON.stringify (cif);
        }

        if (fullPrivacyEnabled) {
          xhrData.fp_status = true;
        }

        if (developerSetLanguage) {
          xhrData.developer_set_language = developerSetLanguage;
        }

        upload ({
          route: routes.postIssue (domain),
          files: attachmentFiles,
          formData: xhrHelpers.getPreparedXhrData (xhrData),
          headers: xhrHelpers.getCommonHeaders (),
          onSuccess: () => {
            dispatch (setBusinessHoursFormSubmitted ());
          },
          onFailure: (failureResponse) => {
            const responseAttachments = objectUtils.getIn (
              failureResponse,
              ["responseData", "data", "attachments"]
            );
            if (responseAttachments && responseAttachments.length) {
              const attachmentsWithError = getAttachmentsErrorActions (
                responseAttachments
              );
              if (attachmentsWithError.length) {
                dispatch (batchActions (attachmentsWithError));
              }
            }
          },
          onEnd: () => {
            dispatch (enableBusinessHoursContactForm ());
          }
        });
      };
    };

    /**
     * Action to save business hours contact form details
     */
    const submitBusinessHoursContactForm = () => {
      // @TODO: Check with dataplat if issue_created should be tracked
      // for out of business hours form.
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

    /**
     * Action to add attachments to store
     * @param {Object} files - Array like files object
     * @returns {Object} - Action
     */
    const addAttachments = (files) => {
      return {
        type: ACTION_TYPES.ADD_BUSINESS_HOURS_ATTACHMENTS,
        files
      };
    };

    /**
     * Action to remove attachment from store
     * @param {String} attachmentId - id of attachment
     * @returns {Object} - Action
     */
    const removeAttachment = (attachmentId) => {
      return {
        type: ACTION_TYPES.REMOVE_BUSINESS_HOURS_ATTACHMENT,
        attachmentId
      };
    };

    /**
     * Action to set attachment error
     * @param {Number} attachmentIndex - attachment index
     * @returns {Object} - Action
     */
    const setAttachmentError = (attachmentIndex) => {
      return {
        type: ACTION_TYPES.SET_BUSINESS_HOURS_ATTACHMENT_ERROR,
        attachmentIndex
      };
    };

    /**
     * Return array of actions for attachment having error
     * @param {Array} attachments
     * @returns {Array} - Array of actions for attachment having error
     */
    const getAttachmentsErrorActions = (attachments) => {
      const errorAttachmentsActions = [];

      attachments.forEach ((attachment, index) => {
        if (attachment.error) {
          errorAttachmentsActions.push (setAttachmentError (index));
        }
      });

      return errorAttachmentsActions;
    };

    return {
      setBusinessHoursContactFormDetails,
      submitBusinessHoursContactForm,
      createIssueOutOfBusinessHours,
      addAttachments,
      removeAttachment
    };
  }
);
