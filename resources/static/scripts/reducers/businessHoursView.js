/**
 * Business Hours Reducer.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 4, 2017
 */

define ("reducers/businessHoursView",
  [
    "constants/actionTypes",
    "constants/businessHoursView",
    "constants/attachments",
    "helpers/attachments",
    "gunpowder/utils/uuid"
  ],
  function (ACTION_TYPES, BUSINESS_HOURS_CONSTANTS, ATTACHMENT_CONSTANTS,
    attachmentsHelper, uuidGenerator) {
    "use strict";

    const update = React.addons.update;
    const {NAME, EMAIL, MESSAGE} = BUSINESS_HOURS_CONSTANTS.CONTACT_FORM_FIELDS;
    const {ATTACHMENT_OPERATIONS} = ATTACHMENT_CONSTANTS;

    const INITIAL_STATE = {
      businessHoursEnabled: false,
      inBusinessHours: true,
      offlineBehaviour: "",
      contactFormDisabled: false,
      contactFormSubmitted: false,
      submitInProgress: false,
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
        },
        attachmentsMeta: {
          enabled: false,
          limitExceeded: false,
          sizeExceeded: false
        },
        attachments: []
      }
    };

    // @TODO :- Move processing functions to helper

    /**
     * Returns processed attachments
     * @param {Object} files - Files list array like object
     * @returns {Array} - processed attachments
     */
    const _getProcessedAttachments = (files) => {
      const processedAttachments = [];

      for (let i = 0; i < files.length; i++) {
        const file = files [i];
        processedAttachments.push ({
          id: uuidGenerator (),
          name: file.name,
          size: file.size,
          // file is DOM object and saved in store as we want to send raw file
          // object in api call when contact form is saved
          file,
          attachmentHasError: false
        });
      }

      return processedAttachments;
    };

    /**
     * Returns filtered array excluding attachment to remove
     * @param {Array} attachments - array of attachments in store
     * @param {String} attachmentIdToRemove - attachment id to remove
     */
    const _getFilteredAttachments = (attachments, attachmentIdToRemove) => {
      return attachments.filter ((attachment) => {
        return attachment.id !== attachmentIdToRemove;
      });
    };

    /**
     * Predicate to check validity of total size of all the attachments
     * @param {Array} processedAttachments - Array of processed attachments
     * @returns {Boolean} - Total attachment size is valid
     */
    const isTotalSizeOfAttachmentsValid = (processedAttachments) => {
      let totalSize = 0;

      processedAttachments.forEach ((attachment) => {
        totalSize += attachment.size;
      });

      return attachmentsHelper.isAttachmentsSizeValid (totalSize);
    };

    return (state = INITIAL_STATE, action) => {
      let attachmentNumberIsInvalid;
      let attachmentSizeIsInvalid;

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
              },
              attachmentsMeta: {
                enabled: {$set: businessHours.attachments_enabled}
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
            submitInProgress: {$set: false},
            contactFormDisabled: {$set: false}
          });

        case ACTION_TYPES.DISABLE_BUSINESS_HOURS_CONTACT_FORM:
          return update (state, {
            submitInProgress: {$set: true},
            contactFormDisabled: {$set: true}
          });

        case ACTION_TYPES.SET_BUSINESS_HOURS_FORM_SUBMITTED:
          return update (state, {
            contactFormSubmitted: {$set: true}
          });

        case ACTION_TYPES.ADD_BUSINESS_HOURS_ATTACHMENTS:
          const processedAttachments = _getProcessedAttachments (action.files);
          attachmentNumberIsInvalid = !(attachmentsHelper.isAttachmentsNumberValid (
            state.contactFormDetails.attachments.length,
            processedAttachments.length,
            ATTACHMENT_OPERATIONS.ADD
          ));
          attachmentSizeIsInvalid = !(isTotalSizeOfAttachmentsValid (
            processedAttachments.concat (state.contactFormDetails.attachments)
          ));

          return update (state, {
            contactFormDisabled: {
              $set: (attachmentNumberIsInvalid || attachmentSizeIsInvalid)
            },
            contactFormDetails: {
              attachments: {$push: processedAttachments},
              attachmentsMeta: {
                limitExceeded: {$set: attachmentNumberIsInvalid},
                sizeExceeded: {$set: attachmentSizeIsInvalid}
              }
            }
          });

        case ACTION_TYPES.REMOVE_BUSINESS_HOURS_ATTACHMENT:
          const filteredAttachments = _getFilteredAttachments (
            state.contactFormDetails.attachments, action.attachmentId
          );

          attachmentNumberIsInvalid = !(attachmentsHelper.isAttachmentsNumberValid (
            state.contactFormDetails.attachments.length,
            filteredAttachments.length,
            ATTACHMENT_OPERATIONS.REMOVE
          ));

          attachmentSizeIsInvalid = !(isTotalSizeOfAttachmentsValid (
            filteredAttachments
          ));

          return update (state, {
            contactFormDisabled: {
              $set: (attachmentNumberIsInvalid || attachmentSizeIsInvalid)
            },
            contactFormDetails: {
              attachments: {$set: filteredAttachments},
              attachmentsMeta: {
                limitExceeded: {$set: attachmentNumberIsInvalid},
                sizeExceeded: {$set: attachmentSizeIsInvalid}
              }
            }
          });

        case ACTION_TYPES.SET_BUSINESS_HOURS_ATTACHMENT_ERROR:
          return update (state, {
            contactFormDetails: {
              attachments: {
                [action.attachmentIndex]: {
                  attachmentHasError: {$set: true}
                }
              }
            }
          });

        default:
          return state;
      }
    };
  }
);
