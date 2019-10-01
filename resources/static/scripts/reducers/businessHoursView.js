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
    "gunpowder/utils/uuid",
    "extras/accessibility",
    "constants/accessibility"
  ],
  function (ACTION_TYPES, BUSINESS_HOURS_CONSTANTS, ATTACHMENT_CONSTANTS,
    attachmentsHelper, uuidGenerator, ax, axConstants) {
    "use strict";

    const update = React.addons.update;
    const {NAME, EMAIL, MESSAGE} = BUSINESS_HOURS_CONSTANTS.CONTACT_FORM_FIELDS;
    const {
      ATTACHMENT_OPERATIONS,
      BUSINESS_HOURS_ALLOWED_REMOVE_COUNT
    } = ATTACHMENT_CONSTANTS;
    const {DATA_LABELS, META_LIST_ITEM_NAME} = axConstants;

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
          featureIsEnabled: false,
          limitHasExceeded: false,
          sizeHasExceeded: false,
          attachmentsAreInvalid: false
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
        const id = uuidGenerator ();

        ax.addSelector ({
          name: META_LIST_ITEM_NAME.OOBH.FILE_ATTACHMENTS,
          selector: `[data-label=${DATA_LABELS.OOBH.ATTACHMENT_PREFIX}${id}]`
        });

        processedAttachments.push ({
          id: id,
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

    /**
     * Predicate to check if all files have valid mime type
     * @param {Object[]} attachments
     * @returns {Boolean}
     */
    const areAttachmentsValid = (attachments) => {
      if (!attachments.length) {
        return true;
      }

      return Array.prototype.every.call (attachments, ({file}) => {
        return attachmentsHelper.isAttachmentTypeValid (file.type);
      });
    };

    return (state = INITIAL_STATE, action) => {
      let attachmentNumberIsInvalid;
      let attachmentSizeIsInvalid;
      let attachmentsAreInvalid;

      switch (action.type) {
        case ACTION_TYPES.SET_WM_CONFIG:
          const {
            config: {
              business_hours_enabled: businessHoursEnabled,
              in_business_hours: inBusinessHours,
              business_hours: {
                offline_behavior: offlineBehaviour,
                cf_fields: contactFormFields,
                attachments_enabled: attachmentEnabled
              }
            }
          } = action;

          const updateObject = {
            businessHoursEnabled: {$set: businessHoursEnabled},
            inBusinessHours: {$set: inBusinessHours}
          };

          if (businessHoursEnabled) {
            updateObject.offlineBehaviour = {$set: offlineBehaviour};

            updateObject.contactFormDetails = {
              name: {
                enabled: {$set: contactFormFields.name}
              },
              email: {
                enabled: {$set: contactFormFields.email}
              },
              message: {
                enabled: {$set: contactFormFields.message}
              },
              attachmentsMeta: {
                featureIsEnabled: {
                  $set: attachmentEnabled
                }
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

          const allAttachments = processedAttachments.concat (
            state.contactFormDetails.attachments
          );

          attachmentSizeIsInvalid = !(isTotalSizeOfAttachmentsValid (allAttachments));
          attachmentsAreInvalid = !(areAttachmentsValid (allAttachments));

          return update (state, {
            contactFormDisabled: {
              $set: (
                attachmentNumberIsInvalid ||
                attachmentSizeIsInvalid ||
                attachmentsAreInvalid
              )
            },
            contactFormDetails: {
              attachments: {$push: processedAttachments},
              attachmentsMeta: {
                limitHasExceeded: {$set: attachmentNumberIsInvalid},
                sizeHasExceeded: {$set: attachmentSizeIsInvalid},
                attachmentsAreInvalid: {$set: attachmentsAreInvalid}
              }
            }
          });

        case ACTION_TYPES.REMOVE_BUSINESS_HOURS_ATTACHMENT:
          ax.removeSelector ({
            name: META_LIST_ITEM_NAME.OOBH.FILE_ATTACHMENTS,
            selector: `[data-label=${DATA_LABELS.OOBH.ATTACHMENT_PREFIX}${action.attachmentId}]`
          });
          ax.delayFocus ();

          const filteredAttachments = _getFilteredAttachments (
            state.contactFormDetails.attachments, action.attachmentId
          );

          attachmentNumberIsInvalid = !(attachmentsHelper.isAttachmentsNumberValid (
            state.contactFormDetails.attachments.length,
            BUSINESS_HOURS_ALLOWED_REMOVE_COUNT,
            ATTACHMENT_OPERATIONS.REMOVE
          ));

          attachmentSizeIsInvalid = !(isTotalSizeOfAttachmentsValid (filteredAttachments));
          attachmentsAreInvalid = !(areAttachmentsValid (filteredAttachments));

          return update (state, {
            contactFormDisabled: {
              $set: (
                attachmentNumberIsInvalid ||
                attachmentSizeIsInvalid ||
                attachmentsAreInvalid
              )
            },
            contactFormDetails: {
              attachments: {$set: filteredAttachments},
              attachmentsMeta: {
                limitHasExceeded: {$set: attachmentNumberIsInvalid},
                sizeHasExceeded: {$set: attachmentSizeIsInvalid},
                attachmentsAreInvalid: {$set: attachmentsAreInvalid}
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

        case ACTION_TYPES.RESET:
          return INITIAL_STATE;

        default:
          return state;
      }
    };
  }
);
