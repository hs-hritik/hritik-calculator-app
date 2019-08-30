/**
 * Business Hours View.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 3, 2017
 */

define ("components/businessHoursView",
  [
    "components/commons/viewHeader",
    "components/containers/branding",
    "components/commons/fileInput",
    "components/commons/dndWrapper",
    "constants/businessHoursView",
    "helpers/attachments",
    "gunpowder/utils/classes",
    "extras/accessibility",
    "constants/activeView",
    "constants/accessibility"
  ],
  function (ViewHeader, BrandingContainer, FileInput, DnDWrapper, BUSINESS_HOURS_CONTANTS,
    attachmentsHelpers, classes, ax, activeViewConstants, axConstants) {
    "use strict";

    const PropTypes = React.PropTypes;
    const FORM_FIELD_PROP_TYPE = PropTypes.shape ({
      enabled: PropTypes.bool,
      value: PropTypes.shape ({
        name: PropTypes.string,
        value: PropTypes.string,
        validations: PropTypes.array
      }).isRequired
    }).isRequired;
    const ATTACHMENT_PROP_TYPE = PropTypes.shape ({
      id: PropTypes.string,
      name: PropTypes.string,
      size: PropTypes.number
    });
    const KEYCODES = {axConstants};
    const {NAME, EMAIL, MESSAGE} = BUSINESS_HOURS_CONTANTS.CONTACT_FORM_FIELDS;
    const {CONTACT_FORM, OFFLINE_MESSAGE} = BUSINESS_HOURS_CONTANTS.OFFLINE_BEHAVIOUR;
    const {DATA_LABELS} = axConstants;

    return React.createClass ({
      displayName: "BusinessHoursView",
      propTypes: {
        showCloseButton: PropTypes.bool.isRequired,
        allowFullScreen: PropTypes.bool,
        text: PropTypes.shape ({
          closeConversationBtn: PropTypes.string.isRequired,
          businessHoursSubmitBtn: PropTypes.string.isRequired,
          businessHoursViewHeader: PropTypes.string.isRequired,
          businessHoursContactFormMessage: PropTypes.string.isRequired,
          businessHoursOfflineMessage: PropTypes.string.isRequired,
          businessHoursThankYouMessage: PropTypes.string.isRequired,
          businessHoursAttachmentsLimitExceedMsg: PropTypes.string.isRequired,
          businessHoursAttachmentsSizeExceedMsg: PropTypes.string.isRequired,
          attachmentFileTypeError: PropTypes.string.isRequired,
          attachmentDefaultError: PropTypes.string.isRequired,
          dndInfoText: PropTypes.string.isRequired
        }).isRequired,
        contactFormDetails: PropTypes.shape ({
          name: FORM_FIELD_PROP_TYPE,
          email: FORM_FIELD_PROP_TYPE,
          message: FORM_FIELD_PROP_TYPE,
          attachments: PropTypes.arrayOf (ATTACHMENT_PROP_TYPE).isRequired,
          attachmentsMeta: PropTypes.shape ({
            featureIsEnabled: PropTypes.bool,
            limitHasExceeded: PropTypes.bool,
            sizeHasExceeded: PropTypes.bool,
            attachmentsAreInvalid: PropTypes.bool
          }).isRequired
        }).isRequired,
        offlineBehaviour: PropTypes.oneOf ([CONTACT_FORM, OFFLINE_MESSAGE]),
        onMinimizeConversation: PropTypes.func.isRequired,
        onChangeBusinessHoursContactFormDetails: PropTypes.func.isRequired,
        onSubmitBusinessHoursContactForm: PropTypes.func.isRequired,
        onFilesChange: PropTypes.func.isRequired,
        onRemoveAttachment: PropTypes.func.isRequired,
        contactFormSubmitted: PropTypes.bool.isRequired,
        contactFormDisabled: PropTypes.bool.isRequired,
        submitInProgress: PropTypes.bool.isRequired,
        viewStyles: PropTypes.shape ({
          fontFamily: PropTypes.string
        }),
        fullPrivacyEnabled: PropTypes.bool
      },
      render () {
        const {
          text,
          showCloseButton,
          onMinimizeConversation,
          onFilesChange,
          contactFormDetails,
          viewStyles,
          fullPrivacyEnabled
        } = this.props;

        const {featureIsEnabled} = contactFormDetails.attachmentsMeta;
        const attachmentIsEnabled = featureIsEnabled && !fullPrivacyEnabled;

        return (
          <div className="hs-view" style={viewStyles}>
            <ViewHeader title={text.businessHoursViewHeader}
                        showCloseBtn={showCloseButton}
                        onCloseBtnClick={onMinimizeConversation} />
              <div className="hs-view__content">
                <DnDWrapper dragInfoText={text.dndInfoText}
                            onDrop={onFilesChange}
                            enabled={attachmentIsEnabled} >
                  {this._renderContactForm ()}
                  {this._renderOfflineMessage ()}
                  {this._renderFooter ()}
                </DnDWrapper>
              </div>
          </div>
        );
      },

      /**
       * Render business hours contact form
       */
      _renderContactForm () {
        const {
          text,
          offlineBehaviour,
          contactFormSubmitted
        } = this.props;

        if (offlineBehaviour !== CONTACT_FORM || contactFormSubmitted) {
          return null;
        }

        return (
          <div
            className="hs-business-hours"
            data-label={DATA_LABELS.OOBH.WRAPPER}
            tabIndex="0">
            <div>
              <p className="hs-business-hours__offline-message">
                {text.businessHoursContactFormMessage}
              </p>
              {this._renderFormField (NAME)}
              {this._renderFormField (EMAIL)}
              {this._renderFormField (MESSAGE)}
              {this._renderAttachments ()}
              <BrandingContainer />
            </div>
          </div>
        );
      },

      /**
       * Render offline message
       */
      _renderOfflineMessage () {
        const {offlineBehaviour, contactFormSubmitted, text} = this.props;

        if (offlineBehaviour !== OFFLINE_MESSAGE && !contactFormSubmitted) {
          return null;
        }

        let infoMessage;
        let messageClass = "";

        if (contactFormSubmitted) {
          infoMessage = text.businessHoursThankYouMessage;
          messageClass = "hs-business-hours__thank-you-message";
        } else {
          infoMessage = text.businessHoursOfflineMessage;
          messageClass = "hs-business-hours__offline-message";
        }

        return (
          <div
            className="hs-business-hours"
            data-label={DATA_LABELS.OOBH.OFFLINE_MSG}
            tabIndex="0">
            <p className={messageClass}>
              {infoMessage}
            </p>
            <div>
              <BrandingContainer />
            </div>
          </div>
        );
      },

      /**
       * Render footer with button
       */
      _renderFooter () {
        const {
          contactFormSubmitted,
          text,
          onMinimizeConversation,
          contactFormDisabled,
          offlineBehaviour,
          allowFullScreen
        } = this.props;

        let btnText, clickHandler;
        if ((offlineBehaviour === CONTACT_FORM && contactFormSubmitted) ||
             offlineBehaviour === OFFLINE_MESSAGE) {
          btnText = text.closeConversationBtn;
          clickHandler = onMinimizeConversation;
        } else {
          btnText = text.businessHoursSubmitBtn;
          clickHandler = this._onSendButtonClick;
        }

        const footerClasses = classes ("hs-footer",
        "hs-footer--center-items", {
          "hs-footer--full-screen": allowFullScreen
        });

        return (
          <div className={footerClasses}>
            <button className="hs-button hs-footer__btn "
                    disabled={contactFormDisabled}
                    data-label={DATA_LABELS.OOBH.FOOTER_BTN}
                    tabIndex="0"
                    onClick={clickHandler} >
              {btnText}
            </button>
          </div>
        );
      },

      /**
       * Render formfield
       * @param {fieldName} - Name of formfield (name, email or message)
       */
      _renderFormField (fieldName) {
        const formField = this.props.contactFormDetails [fieldName];

        if (!formField.enabled) {
          return null;
        }

        const {text, contactFormDisabled} = this.props;
        let formFieldLabel = "";
        let inputEl = null;
        let errorIconEl = null;
        let inputClasses = "";

        switch (fieldName) {
          case NAME:
            formFieldLabel = text.businessHoursNameLabel;
            inputClasses = "hs-form-field__input hs-business-hours__form-input";
            inputEl = (
              <input type="text"
                     disabled={contactFormDisabled}
                     className={inputClasses}
                     placeholder={text.businessHoursNamePlaceholder}
                     value={formField.value.value}
                     data-label={DATA_LABELS.OOBH.NAME}
                     tabIndex="0"
                     onChange={this._onNameChange} />
            );
            break;

          case EMAIL:
            formFieldLabel = text.businessHoursEmailLabel;
            inputClasses = "hs-form-field__input hs-business-hours__form-input";
            inputEl = (
              <input type="text"
                     disabled={contactFormDisabled}
                     className={inputClasses}
                     placeholder={text.businessHoursEmailPlaceholder}
                     value={formField.value.value}
                     data-label={DATA_LABELS.OOBH.EMAIL}
                     tabIndex="0"
                     onChange={this._onEmailChange} />
            );
            break;

          case MESSAGE:
            formFieldLabel = text.businessHoursMessageLabel;
            inputClasses = "hs-form-field__input hs-business-hours__message " +
                           "hs-business-hours__form-input";
            inputEl = (
              <textarea className={inputClasses}
                        disabled={contactFormDisabled}
                        placeholder={text.businessHoursMessagePlaceholder}
                        value={formField.value.value}
                        data-label={DATA_LABELS.OOBH.MESSAGE}
                        tabIndex="0"
                        onChange={this._onMessageChange} />
            );
            break;
        }

        const formFieldClasses = classes (
          "hs-form-field", {
            "hs-form-field--error": !!formField.value.errorMsg
          }
        );

        if (formField.value.errorMsg) {
          errorIconEl = (
            <i className="ion-alert-circled hs-form-field__error-icon" />
          );
        }

        return (
          <div className={formFieldClasses}>
            <div className="hs-form-field__label hs-business-hours__form-label">
              {formFieldLabel}
            </div>
            {inputEl}
            {errorIconEl}
          </div>
        );
      },

      /**
       * Render attachments
       */
      _renderAttachments () {
        const {
          contactFormDetails: {
            attachments,
            attachmentsMeta,
            attachmentsMeta: {
              featureIsEnabled
            }
          },
          fullPrivacyEnabled
        } = this.props;

        if (!featureIsEnabled || fullPrivacyEnabled) {
          return null;
        }

        let attachmentsWrapperEl = null;

        if (attachments.length) {
          const attachmentsEl = attachments.map (this._renderAttachment);
          const {
            limitHasExceeded,
            sizeHasExceeded,
            attachmentsAreInvalid
          } = attachmentsMeta;
          const wrapperClasses = classes (
            "hs-business-hours__attachment-wrapper", {
              error: limitHasExceeded || sizeHasExceeded || attachmentsAreInvalid
            }
          );
          attachmentsWrapperEl = (
            <div className={wrapperClasses}>
              {attachmentsEl}
            </div>
          );
        }

        return (
          <div>
            {attachmentsWrapperEl}
            {this._renderAttachmentErrors ()}
            {this._renderPlaceholderAttachment ()}
          </div>
        );
      },

      /**
       * Render attachment
       * @param {Object} attachment - attachment object
       */
      _renderAttachment (attachment) {
        const {submitInProgress} = this.props;
        const {id, name, size, attachmentHasError} = attachment;
        let iconEl = null;
        let attachmentErrorEl = null;

        if (submitInProgress) {
          iconEl = (
            <i className="ion-load-b ion--spinning" />
          );
        } else {
          const dataLabelAttribute = `${DATA_LABELS.OOBH.ATTACHMENT_PREFIX}${id}`;
          const iconClasses = classes (
            "ion-cross",
            "hs-business-hours__small-icon",
            "hs-business-hours__remove-icon"
          );
          iconEl = (
            <i className={iconClasses}
               onClick={this._onRemoveAttachmentClick.bind (this, id)}
               tabIndex="0"
               data-label={dataLabelAttribute} />
          );
        }

        if (attachmentHasError) {
          attachmentErrorEl = (
            <div className="hs-business-hours__attachment-error">
              <i className="ion-alert-circled hs-business-hours__small-icon" />
              <span>{this.props.text.attachmentDefaultError}</span>
            </div>
          );
        }

        const formattedName = attachmentsHelpers.getFormattedFileName (name);
        const formattedSize = attachmentsHelpers.humanizeFileSize (size);

        const attachmentClasses = classes (
          "hs-business-hours__attachment", {
            "hs-business-hours__attachment-with-error": attachmentHasError
          }
        );

        return ([
          (<div className={attachmentClasses} key={id}>
            <div className="hs-business-hours__attachment-details-wrapper">
              <i className="ion-attachment" />
              <span className="hs-business-hours__attachment-name">
                {formattedName}
              </span>
              <span className="hs-business-hours__attachment-size" >
                ({formattedSize})
              </span>
            </div>
            {iconEl}
          </div>),
          attachmentErrorEl
        ]);
      },

      /**
       * Render placeholder attachment layout
       */
      _renderPlaceholderAttachment () {
        const {onFilesChange, text: {dndInfoText}} = this.props;
        const {
          limitHasExceeded,
          sizeHasExceeded,
          attachmentsAreInvalid
        } = this.props.contactFormDetails.attachmentsMeta;

        const fileInputIsDisabled = (limitHasExceeded || sizeHasExceeded || attachmentsAreInvalid);

        return (
          <div
            className="hs-business-hours__attachment-placeholder"
            data-label={DATA_LABELS.OOBH.FILE_SELECT}
            tabIndex="0"
            onKeyDown={this.onKeyDown}>
            <FileInput iconClasses="ion-attachment"
                       disabled={fileInputIsDisabled}
                       onChange={onFilesChange}
                       labelClasses="hs-business-hours__attachment-placeholder-text"
                       onSaveInputRef={this._saveInputRef}
                       infoText={dndInfoText} />
          </div>
        );
      },

      /**
       * Render attachment file limit error
       */
      _renderAttachmentErrors () {
        const {
          limitHasExceeded,
          sizeHasExceeded,
          attachmentsAreInvalid
        } = this.props.contactFormDetails.attachmentsMeta;

        if (!limitHasExceeded && !sizeHasExceeded && !attachmentsAreInvalid) {
          return null;
        }

        const {
          businessHoursAttachmentsLimitExceedMsg,
          businessHoursAttachmentsSizeExceedMsg,
          attachmentFileTypeError
        } = this.props.text;

        let limitExceedInfoTextEl = null;
        let sizeExceedInfoTextEl = null;
        let invalidTypeInfoTextEl = null;

        if (limitHasExceeded) {
          limitExceedInfoTextEl = this._renderAttachmentError (
            businessHoursAttachmentsLimitExceedMsg
          );
        }

        if (sizeHasExceeded) {
          sizeExceedInfoTextEl = this._renderAttachmentError (
            businessHoursAttachmentsSizeExceedMsg
          );
        }

        if (attachmentsAreInvalid) {
          invalidTypeInfoTextEl = this._renderAttachmentError (
            attachmentFileTypeError
          );
        }

        return (
          <div>
            {limitExceedInfoTextEl}
            {sizeExceedInfoTextEl}
            {invalidTypeInfoTextEl}
          </div>
        );
      },

      /**
       * Render attachment error
       * @param {String} text - error text
       */
      _renderAttachmentError (text) {
        return (
          <small className="hs-business-hours__attachment-limit-error">
            <i className="ion-alert-circled hs-business-hours__small-icon" />
            <span>{text}</span>
          </small>
        );
      },

      _fileInputRef: null,

      /**
       * Set ref for fileInput component
       */
      _saveInputRef (fileInputRef) {
        this._fileInputRef = fileInputRef;
      },

      /**
       * Handler for keyDown event on attachment wrapper
       * @param {Object} ev - Event for key down
       */
      onKeyDown (ev) {
        if (ev.keyCode === KEYCODES.ENTER || ev.keyCode === KEYCODES.SPACE) {
          if (this._fileInputRef) {
            this._fileInputRef.click ();
          }
        }
      },

      /**
       * Change handler for name
       * @param {Object} ev - change event of name input field
       */
      _onNameChange (ev) {
        this.props.onChangeBusinessHoursContactFormDetails (
          NAME, ev.target.value
        );
      },

      /**
       * Change handler for email
       * @param {Object} ev - change event of email input field
       */
      _onEmailChange (ev) {
        this.props.onChangeBusinessHoursContactFormDetails (
          EMAIL, ev.target.value
        );
      },

      /**
       * Change handler for message
       * @param {Object} ev - change event of message text area
       */
      _onMessageChange (ev) {
        this.props.onChangeBusinessHoursContactFormDetails (
          MESSAGE, ev.target.value
        );
      },

      /**
       * Click handler for 'Send' button
       */
      _onSendButtonClick () {
        this.props.onSubmitBusinessHoursContactForm ();
      },

      /**
       * Click handler for 'X' icon of attachment
       * @param {String} attachmentId - attachment id to remove
       */
      _onRemoveAttachmentClick (attachmentId) {
        this.props.onRemoveAttachment (attachmentId);
      },

      componentDidMount () {
        ax.setActiveView (activeViewConstants.BUSINESS_HOURS);
        ax.focus ();
      }
    });
  }
);
