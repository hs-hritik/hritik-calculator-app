/**
 * Business Hours View.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 3, 2017
 */

define ("components/businessHoursView",
  [
    "components/commons/viewHeader",
    "components/commons/branding",
    "components/commons/fileInput",
    "constants/businessHoursView",
    "gunpowder/utils/classes"
  ],
  function (ViewHeader, Branding, FileInput, BUSINESS_HOURS_CONTANTS, classes) {
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

    const {NAME, EMAIL, MESSAGE} = BUSINESS_HOURS_CONTANTS.CONTACT_FORM_FIELDS;
    const {CONTACT_FORM, OFFLINE_MESSAGE} = BUSINESS_HOURS_CONTANTS.OFFLINE_BEHAVIOUR;

    return React.createClass ({
      displayName: "BusinessHoursView",
      propTypes: {
        browserIsMobile: PropTypes.bool.isRequired,
        text: PropTypes.shape ({
          closeConversationBtn: PropTypes.string.isRequired,
          businessHoursSubmitBtn: PropTypes.string.isRequired,
          businessHoursViewHeader: PropTypes.string.isRequired,
          businessHoursContactFormMessage: PropTypes.string.isRequired,
          businessHoursOfflineMessage: PropTypes.string.isRequired,
          businessHoursThankYouMessage: PropTypes.string.isRequired,
          dndInfoText: PropTypes.string.isRequired
        }).isRequired,
        contactFormDetails: PropTypes.shape ({
          name: FORM_FIELD_PROP_TYPE,
          email: FORM_FIELD_PROP_TYPE,
          message: FORM_FIELD_PROP_TYPE,
          attachments: PropTypes.arrayOf (ATTACHMENT_PROP_TYPE).isRequired,
          attachmentsMeta: PropTypes.shape ({
            attachmentsEnabled: PropTypes.bool
          })
        }).isRequired,
        offlineBehaviour: PropTypes.oneOf ([CONTACT_FORM, OFFLINE_MESSAGE]),
        onMinimizeConversation: PropTypes.func.isRequired,
        onChangeBusinessHoursContactFormDetails: PropTypes.func.isRequired,
        onSubmitBusinessHoursContactForm: PropTypes.func.isRequired,
        onFilesChange: PropTypes.func.isRequired,
        onRemoveAttachment: PropTypes.func.isRequired,
        contactFormSubmitted: PropTypes.bool.isRequired,
        contactFormDisabled: PropTypes.bool.isRequired
      },
      render () {
        const {text, browserIsMobile, onMinimizeConversation} = this.props;

        return (
          <div className="hs-view">
            <ViewHeader title={text.businessHoursViewHeader}
                        showCloseBtn={browserIsMobile}
                        onCloseBtnClick={onMinimizeConversation} />
            <div className="hs-view__content">
              {this._renderContactForm ()}
              {this._renderOfflineMessage ()}
            </div>
          </div>
        );
      },

      /**
       * Render business hours contact form
       */
      _renderContactForm () {
        const {text, offlineBehaviour, contactFormSubmitted} = this.props;

        if (offlineBehaviour !== CONTACT_FORM || contactFormSubmitted) {
          return null;
        }

        return (
          <div className="hs-business-hours">
            <div>
              <p>{text.businessHoursContactFormMessage}</p>
              {this._renderFormField (NAME)}
              {this._renderFormField (EMAIL)}
              {this._renderFormField (MESSAGE)}
              {this._renderAttachments ()}
              <Branding text={text} />
            </div>
            {this._renderFooter ()}
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

        const infoMessage = contactFormSubmitted ? text.businessHoursThankYouMessage :
                            text.businessHoursOfflineMessage;

        return (
          <div className="hs-business-hours">
            <p>{infoMessage}</p>
            <div>
              <Branding text={text} />
              {this._renderFooter ()}
            </div>
          </div>
        );
      },

      /**
       * Render footer with button
       */
      _renderFooter () {
        const {contactFormSubmitted, text, onMinimizeConversation,
               contactFormDisabled, offlineBehaviour} = this.props;

        let btnText, clickHandler;
        if ((offlineBehaviour === CONTACT_FORM && contactFormSubmitted) ||
             offlineBehaviour === OFFLINE_MESSAGE) {
          btnText = text.closeConversationBtn;
          clickHandler = onMinimizeConversation;
        } else {
          btnText = text.businessHoursSubmitBtn;
          clickHandler = this._onSendButtonClick;
        }

        return (
          <div className="hs-footer hs-footer--center-items hs-footer--clear-bg">
            <button className="hs-button hs-footer__btn"
                    disabled={contactFormDisabled}
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

        switch (fieldName) {
          case NAME:
            formFieldLabel = text.businessHoursNameLabel;
            inputEl = (
              <input type="text"
                     disabled={contactFormDisabled}
                     className="hs-form-field__input"
                     placeholder={text.businessHoursNamePlaceholder}
                     value={formField.value.value}
                     onChange={this._onNameChange} />
            );
            break;

          case EMAIL:
            formFieldLabel = text.businessHoursEmailLabel;
            inputEl = (
              <input type="text"
                     disabled={contactFormDisabled}
                     className="hs-form-field__input"
                     placeholder={text.businessHoursEmailPlaceholder}
                     value={formField.value.value}
                     onChange={this._onEmailChange} />
            );
            break;

          case MESSAGE:
            formFieldLabel = text.businessHoursMessageLabel;
            inputEl = (
              <textarea className="hs-form-field__input hs-business-hours__message"
                        disabled={contactFormDisabled}
                        placeholder={text.businessHoursMessagePlaceholder}
                        value={formField.value.value}
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
            <div className="hs-form-field__label">{formFieldLabel}</div>
            {inputEl}
            {errorIconEl}
          </div>
        );
      },

      /**
       * Render attachments
       */
      _renderAttachments () {
        const {attachmentsEnabled} = this.props.contactFormDetails.attachmentsMeta;

        if (!attachmentsEnabled) {
          return null;
        }

        const {attachments} = this.props.contactFormDetails;
        let attachmentsWrapperEl = null;

        if (attachments.length) {
          const attachmentsEl = attachments.map (this._renderAttachment);
          attachmentsWrapperEl = (
            <div className="hs-business-hours__attachment-wrapper">
              {attachmentsEl}
            </div>
          );
        }

        return (
          <div>
            {attachmentsWrapperEl}
            {this._renderPlaceholderAttachment ()}
            {this._renderAttachmentErrors ()}
          </div>
        );
      },

      /**
       * Render attachment
       * @param {Object} attachment - attachment object
       */
      _renderAttachment (attachment) {
        const {uploadInProgress, id, name, size, errorText} = attachment;
        let iconEl = null;
        let attachmentErrorEl = null;

        if (uploadInProgress) {
          iconEl = (
            <i className="ion-load-b ion--spinning" />
          );
        } else {
          const iconClasses = classes (
            "ion-cross",
            "hs-business-hours__small-icon",
            "hs-business-hours__remove-icon"
          );
          iconEl = (
            <i className={iconClasses}
               onClick={this._onRemoveAttachmentClick.bind (this, id)} />
          );
        }

        if (errorText) {
          attachmentErrorEl = (
            <div className="hs-business-hours__attachment-error">
              <i className="ion-alert-circled hs-business-hours__small-icon" />
              <span>{errorText}</span>
            </div>
          );
        }

        // @TODO :- Do following
        // a] Display attachment size in MB
        // b] Format file name

        return (
          <div className="hs-business-hours__attachment" key={id}>
            <div className="hs-business-hours__attachment-info-wrapper">
              <i className="ion-attachment" />
              <div className="hs-business-hours__attachment-name-wrapper">
                <div>
                  <span className="hs-business-hours__file-name">
                    {name}
                  </span>
                  <span>({size})</span>
                </div>
                {attachmentErrorEl}
              </div>
            </div>
            {iconEl}
          </div>
        );
      },

      /**
       * Render placeholder attachment layout
       */
      _renderPlaceholderAttachment () {
        const {onFilesChange, text: {dndInfoText}} = this.props;
        return (
          <div className="hs-business-hours__attachment-placeholder">
            <FileInput iconClasses="ion-attachment"
                       onChange={onFilesChange}
                       infoText={dndInfoText} />
          </div>
        );
      },

      /**
       * Render attachment file limit error
       */
      _renderAttachmentErrors () {
        // @TODO :- Conditionally render this layout
        return (
          <small className="hs-business-hours__attachment-limit-error">
            <i className="ion-alert-circled hs-business-hours__small-icon" />
            <span>Maximum limit of attachments reached</span>
          </small>
        );
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
      }
    });
  }
);
