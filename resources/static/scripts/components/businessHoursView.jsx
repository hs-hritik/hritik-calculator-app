/**
 * Business Hours View.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 3, 2017
 */

define("components/businessHoursView", [
  "components/commons/viewHeader",
  "components/containers/branding",
  "components/commons/fileInput",
  "components/commons/dndWrapper",
  "constants/businessHoursView",
  "helpers/attachments",
  "gunpowder/utils/classes",
  "components/errorBoundaryWithLogging",
  "components/errors/appError",
  "components/errors/nonBlockingError",
  "extras/accessibility",
  "constants/activeView",
  "constants/accessibility",
  "constants/keyCodes"
], function(
  ViewHeader,
  BrandingContainer,
  FileInput,
  DnDWrapper,
  BUSINESS_HOURS_CONTANTS,
  attachmentsHelpers,
  classes,
  ErrorBoundaryWithLogging,
  AppError,
  NonBlockingError,
  ax,
  activeViewConstants,
  axConstants,
  KEY_CODES
) {
  "use strict";

  const {NAME, EMAIL, MESSAGE} = BUSINESS_HOURS_CONTANTS.CONTACT_FORM_FIELDS;
  const {CONTACT_FORM, OFFLINE_MESSAGE} = BUSINESS_HOURS_CONTANTS.OFFLINE_BEHAVIOUR;
  const {METALIST_ITEMS, OOBH_SUBVIEW} = axConstants;

  const FORM_FIELD_PROP_TYPE = PropTypes.shape({
    enabled: PropTypes.bool,
    value: PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.string,
      validations: PropTypes.array
    }).isRequired
  }).isRequired;

  const ATTACHMENT_PROP_TYPE = PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    size: PropTypes.number
  });

  const TEXT_PROP_TYPE = PropTypes.shape({
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
    dndInfoText: PropTypes.string.isRequired,
    ariaLabelsRemoveAttachment: PropTypes.string,
    ariaLabelAddedAttachmentPrefix: PropTypes.string,
    ariaLabelAttachFiles: PropTypes.string
  }).isRequired;

  const CONTACT_FORM_DETAILS_PROP_TYPE = PropTypes.shape({
    name: FORM_FIELD_PROP_TYPE,
    email: FORM_FIELD_PROP_TYPE,
    message: FORM_FIELD_PROP_TYPE,
    attachments: PropTypes.arrayOf(ATTACHMENT_PROP_TYPE).isRequired,
    attachmentsMeta: PropTypes.shape({
      featureIsEnabled: PropTypes.bool,
      limitHasExceeded: PropTypes.bool,
      sizeHasExceeded: PropTypes.bool,
      attachmentsAreInvalid: PropTypes.bool
    }).isRequired
  }).isRequired;

  const OFFLINE_BEHAVIOUR_PROP_TYPE = PropTypes.oneOf([CONTACT_FORM, OFFLINE_MESSAGE]);

  class BusinessHoursViewContents extends React.PureComponent {
    constructor(props) {
      super(props);
      this._fileInputRef = null;
      this._onKeyDown = this._onKeyDown.bind(this);

      /**
       * Set ref for fileInput component
       */
      this._saveInputRef = (fileInputRef) => {
        this._fileInputRef = fileInputRef;
      };
    }

    render() {
      const {text, onFilesChange, attachmentIsEnabled} = this.props;

      return (
        <div className="hs-view__content">
          <DnDWrapper
            dragInfoText={text.dndInfoText}
            onDrop={onFilesChange}
            enabled={attachmentIsEnabled}>
            {this._renderContactForm()}
            {this._renderOfflineMessage()}
            {this._renderFooter()}
          </DnDWrapper>
        </div>
      );
    }

    /**
     * Render business hours contact form
     */
    _renderContactForm() {
      const {text, offlineBehaviour, contactFormSubmitted, setAxActiveIndex} = this.props;

      if (offlineBehaviour !== CONTACT_FORM || contactFormSubmitted) {
        return null;
      }

      const _setAxActiveIndex = setAxActiveIndex.bind(null, {
        selector: METALIST_ITEMS.OOBH.WRAPPER.SELECTOR
      });

      return (
        <div
          className="hs-business-hours"
          data-label={METALIST_ITEMS.OOBH.WRAPPER.DATA_LABEL}
          tabIndex="0"
          onFocus={_setAxActiveIndex}>
          <div>
            <p className="hs-business-hours__offline-message">
              {text.businessHoursContactFormMessage}
            </p>
            {this._renderFormField(NAME)}
            {this._renderFormField(EMAIL)}
            {this._renderFormField(MESSAGE)}
            {this._renderAttachments()}
            <BrandingContainer />
          </div>
        </div>
      );
    }

    /**
     * Render offline message
     */
    _renderOfflineMessage() {
      const {offlineBehaviour, contactFormSubmitted, text, setAxActiveIndex} = this.props;

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

      const _setAxActiveIndex = setAxActiveIndex.bind(null, {
        selector: METALIST_ITEMS.OOBH.OFFLINE_MSG.SELECTOR
      });

      return (
        <div
          className="hs-business-hours"
          data-label={METALIST_ITEMS.OOBH.OFFLINE_MSG.DATA_LABEL}
          tabIndex="0"
          onFocus={_setAxActiveIndex}
          onClick={_setAxActiveIndex}>
          <p className={messageClass}>{infoMessage}</p>
          <div>
            <BrandingContainer />
          </div>
        </div>
      );
    }

    /**
     * Render footer with button
     */
    _renderFooter() {
      const {
        contactFormSubmitted,
        text,
        onMinimizeConversation,
        contactFormDisabled,
        offlineBehaviour,
        allowFullScreen,
        setAxActiveIndex
      } = this.props;

      let btnText, clickHandler;
      const _setAxActiveIndex = setAxActiveIndex.bind(null, {
        selector: METALIST_ITEMS.OOBH.FOOTER_BTN.SELECTOR
      });

      if (
        (offlineBehaviour === CONTACT_FORM && contactFormSubmitted) ||
        offlineBehaviour === OFFLINE_MESSAGE
      ) {
        btnText = text.closeConversationBtn;
        clickHandler = (ev) => {
          _setAxActiveIndex(ev);
          onMinimizeConversation();
        };
      } else {
        btnText = text.businessHoursSubmitBtn;
        clickHandler = this.props.onSendButtonClick;
      }

      const footerClasses = classes("hs-footer", "hs-footer--center-items", {
        "hs-footer--full-screen": allowFullScreen
      });

      return (
        <div className={footerClasses}>
          <button
            className="hs-button hs-footer__btn "
            disabled={contactFormDisabled}
            data-label={METALIST_ITEMS.OOBH.FOOTER_BTN.DATA_LABEL}
            tabIndex="0"
            onFocus={_setAxActiveIndex}
            onClick={clickHandler}>
            {btnText}
          </button>
        </div>
      );
    }

    /**
     * Render formfield
     * @param {fieldName} - Name of formfield (name, email or message)
     */
    _renderFormField(fieldName) {
      const formField = this.props.contactFormDetails[fieldName];
      const formFieldsIsValid = !!formField.value.errorMsg;

      if (!formField.enabled) {
        return null;
      }

      const {text, contactFormDisabled, setAxActiveIndex} = this.props;
      let formFieldLabel = "";
      let inputEl = null;
      let errorIconEl = null;
      let inputClasses = "";
      let selectorValue;

      switch (fieldName) {
        case NAME:
          selectorValue = METALIST_ITEMS.OOBH.NAME.SELECTOR;
          break;

        case EMAIL:
          selectorValue = METALIST_ITEMS.OOBH.EMAIL.SELECTOR;
          break;

        case MESSAGE:
          selectorValue = METALIST_ITEMS.OOBH.MESSAGE.SELECTOR;
          break;
      }

      const _setAxActiveIndex = setAxActiveIndex.bind(null, {
        selector: selectorValue
      });

      switch (fieldName) {
        case NAME:
          formFieldLabel = text.businessHoursNameLabel;
          inputClasses = "hs-form-field__input hs-business-hours__form-input";
          inputEl = (
            <input
              type="text"
              disabled={contactFormDisabled}
              className={inputClasses}
              placeholder={text.businessHoursNamePlaceholder}
              value={formField.value.value}
              onChange={this.props.onNameChange}
              data-label={METALIST_ITEMS.OOBH.NAME.DATA_LABEL}
              tabIndex="0"
              onFocus={_setAxActiveIndex}
              onClick={_setAxActiveIndex}
              aria-required
              aria-invalid={formFieldsIsValid}
            />
          );
          break;

        case EMAIL:
          formFieldLabel = text.businessHoursEmailLabel;
          inputClasses = "hs-form-field__input hs-business-hours__form-input";
          inputEl = (
            <input
              type="email"
              disabled={contactFormDisabled}
              className={inputClasses}
              placeholder={text.businessHoursEmailPlaceholder}
              value={formField.value.value}
              onChange={this.props.onEmailChange}
              data-label={METALIST_ITEMS.OOBH.EMAIL.DATA_LABEL}
              tabIndex="0"
              onFocus={_setAxActiveIndex}
              onClick={_setAxActiveIndex}
              aria-required
              aria-invalid={formFieldsIsValid}
            />
          );
          break;

        case MESSAGE:
          formFieldLabel = text.businessHoursMessageLabel;
          inputClasses =
            "hs-form-field__input hs-business-hours__message hs-business-hours__form-input";
          inputEl = (
            <textarea
              className={inputClasses}
              disabled={contactFormDisabled}
              placeholder={text.businessHoursMessagePlaceholder}
              value={formField.value.value}
              onChange={this.props.onMessageChange}
              data-label={METALIST_ITEMS.OOBH.MESSAGE.DATA_LABEL}
              tabIndex="0"
              onFocus={_setAxActiveIndex}
              onClick={_setAxActiveIndex}
              aria-required
              aria-invalid={formFieldsIsValid}
            />
          );
          break;
      }

      const formFieldClasses = classes("hs-form-field", {
        "hs-form-field--error": !!formField.value.errorMsg
      });

      if (formField.value.errorMsg) {
        errorIconEl = <i className="ion-alert-circled hs-form-field__error-icon" />;
      }

      return (
        <div className={formFieldClasses}>
          <div className="hs-form-field__label hs-business-hours__form-label" aria-hidden>
            {formFieldLabel}
          </div>
          {inputEl}
          {errorIconEl}
        </div>
      );
    }

    /**
     * Render attachments
     */
    _renderAttachments() {
      const {
        contactFormDetails: {
          attachments,
          attachmentsMeta,
          attachmentsMeta: {featureIsEnabled}
        },
        fullPrivacyEnabled
      } = this.props;

      if (!featureIsEnabled || fullPrivacyEnabled) {
        return null;
      }

      let attachmentsWrapperEl = null;

      if (attachments.length) {
        const attachmentsEl = attachments.map((attachment) => this._renderAttachment(attachment));

        const {limitHasExceeded, sizeHasExceeded, attachmentsAreInvalid} = attachmentsMeta;
        const wrapperClasses = classes("hs-business-hours__attachment-wrapper", {
          error: limitHasExceeded || sizeHasExceeded || attachmentsAreInvalid
        });
        attachmentsWrapperEl = <div className={wrapperClasses}>{attachmentsEl}</div>;
      }

      return (
        <div>
          {attachmentsWrapperEl}
          {this._renderAttachmentErrors()}
          {this._renderPlaceholderAttachment()}
        </div>
      );
    }

    /**
     * Render attachment
     * @param {Object} attachment - attachment object
     */
    _renderAttachment(attachment) {
      const {
        submitInProgress,
        text: {ariaLabelsRemoveAttachment, ariaLabelAddedAttachmentPrefix},
        onRemoveAttachmentClick,
        setAxActiveIndex
      } = this.props;

      const {id, name, size, attachmentHasError} = attachment;
      let iconEl = null;
      let attachmentErrorEl = null;

      if (submitInProgress) {
        iconEl = <i className="ion-load-b ion--spinning" />;
      } else {
        const dataLabelAttribute = `${METALIST_ITEMS.OOBH.ATTACHMENT_PREFIX.DATA_LABEL}${id}`;
        const iconClasses = classes(
          "ion-cross",
          "hs-business-hours__small-icon",
          "hs-business-hours__remove-icon"
        );

        const _setAxActiveIndex = setAxActiveIndex.bind(null, {
          selector: `[data-label=${dataLabelAttribute}]`
        });

        iconEl = (
          <i
            className={iconClasses}
            onClick={() => onRemoveAttachmentClick(id, dataLabelAttribute)}
            tabIndex="0"
            onFocus={_setAxActiveIndex}
            data-label={dataLabelAttribute}
            aria-label={ariaLabelsRemoveAttachment}
            role="button"
          />
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

      const formattedName = attachmentsHelpers.getFormattedFileName(name);
      const formattedSize = attachmentsHelpers.humanizeFileSize(size);

      const attachmentClasses = classes("hs-business-hours__attachment", {
        "hs-business-hours__attachment-with-error": attachmentHasError
      });
      const ariaLabelText = ariaLabelAddedAttachmentPrefix.replace(
        "{{file_name}}",
        `, ${name}, ${size}`
      );

      return [
        <div className={attachmentClasses} key={id}>
          <div className="hs-business-hours__attachment-details-wrapper" aria-label={ariaLabelText}>
            <i className="ion-attachment" />
            <span className="hs-business-hours__attachment-name" aria-hidden>
              {formattedName}
            </span>
            <span className="hs-business-hours__attachment-size" aria-hidden>
              ({formattedSize})
            </span>
          </div>
          {iconEl}
        </div>,
        attachmentErrorEl
      ];
    }

    /**
     * Render placeholder attachment layout
     */
    _renderPlaceholderAttachment() {
      const {
        onFilesChange,
        text: {dndInfoText, ariaLabelAttachFiles},
        setAxActiveIndex,
        attachmentsWhitelist
      } = this.props;

      const {
        limitHasExceeded,
        sizeHasExceeded,
        attachmentsAreInvalid
      } = this.props.contactFormDetails.attachmentsMeta;

      const fileInputIsDisabled = limitHasExceeded || sizeHasExceeded || attachmentsAreInvalid;
      const _setAxActiveIndex = setAxActiveIndex.bind(null, {
        selector: METALIST_ITEMS.OOBH.FILE_SELECT.SELECTOR
      });
      const allowedMimeTypes = attachmentsWhitelist.join(", ");

      return (
        <div
          className="hs-business-hours__attachment-placeholder"
          data-label={METALIST_ITEMS.OOBH.FILE_SELECT.DATA_LABEL}
          tabIndex="0"
          onKeyDown={this._onKeyDown}
          onFocus={_setAxActiveIndex}
          onClick={_setAxActiveIndex}
          role="button"
          aria-label={ariaLabelAttachFiles}>
          <FileInput
            iconClasses="ion-attachment"
            disabled={fileInputIsDisabled}
            onChange={onFilesChange}
            labelClasses="hs-business-hours__attachment-placeholder-text"
            onSaveInputRef={this._saveInputRef}
            infoText={dndInfoText}
            accept={allowedMimeTypes}
          />
        </div>
      );
    }

    /**
     * Render attachment file limit error
     */
    _renderAttachmentErrors() {
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
        limitExceedInfoTextEl = this._renderAttachmentError(businessHoursAttachmentsLimitExceedMsg);
      }

      if (sizeHasExceeded) {
        sizeExceedInfoTextEl = this._renderAttachmentError(businessHoursAttachmentsSizeExceedMsg);
      }

      if (attachmentsAreInvalid) {
        invalidTypeInfoTextEl = this._renderAttachmentError(attachmentFileTypeError);
      }

      return (
        <div>
          {limitExceedInfoTextEl}
          {sizeExceedInfoTextEl}
          {invalidTypeInfoTextEl}
        </div>
      );
    }

    /**
     * Render attachment error
     * @param {String} text - error text
     */
    _renderAttachmentError(text) {
      return (
        <small className="hs-business-hours__attachment-limit-error">
          <i className="ion-alert-circled hs-business-hours__small-icon" />
          <span>{text}</span>
        </small>
      );
    }

    /**
     * Handler for keyDown event on attachment wrapper
     * @param {Object} ev - Event for key down
     */
    _onKeyDown(ev) {
      if (ev.keyCode === KEY_CODES.ENTER || ev.keyCode === KEY_CODES.SPACE) {
        if (this._fileInputRef) {
          this._fileInputRef.click();
        }
      }
    }
  }

  BusinessHoursViewContents.propTypes = {
    text: TEXT_PROP_TYPE,
    onFilesChange: PropTypes.func.isRequired,
    attachmentIsEnabled: PropTypes.bool.isRequired,
    offlineBehaviour: OFFLINE_BEHAVIOUR_PROP_TYPE,
    contactFormSubmitted: PropTypes.bool.isRequired,
    contactFormDisabled: PropTypes.bool.isRequired,
    allowFullScreen: PropTypes.bool,
    onMinimizeConversation: PropTypes.func.isRequired,
    contactFormDetails: CONTACT_FORM_DETAILS_PROP_TYPE,
    fullPrivacyEnabled: PropTypes.bool,
    submitInProgress: PropTypes.bool.isRequired,
    onSendButtonClick: PropTypes.func.isRequired,
    onNameChange: PropTypes.func.isRequired,
    onEmailChange: PropTypes.func.isRequired,
    onMessageChange: PropTypes.func.isRequired,
    onRemoveAttachmentClick: PropTypes.func.isRequired,
    /**
     * This function is called on focus or click event on element
     * It calls ax function to update active index
     * @param {Object} config.name - Selector value
     * @param {Object} ev - Click or focus event object
     */
    setAxActiveIndex: PropTypes.func.isRequired,
    /**
     * Allowed file mime types list
     */
    attachmentsWhitelist: PropTypes.array.isRequired
  };

  return createReactClass({
    displayName: "BusinessHoursView",
    propTypes: {
      showCloseButton: PropTypes.bool.isRequired,
      allowFullScreen: PropTypes.bool,
      text: TEXT_PROP_TYPE,
      contactFormDetails: CONTACT_FORM_DETAILS_PROP_TYPE,
      offlineBehaviour: OFFLINE_BEHAVIOUR_PROP_TYPE,
      onMinimizeConversation: PropTypes.func.isRequired,
      onKeyDown: PropTypes.func,
      onClick: PropTypes.func,
      onChangeBusinessHoursContactFormDetails: PropTypes.func.isRequired,
      onSubmitBusinessHoursContactForm: PropTypes.func.isRequired,
      onFilesChange: PropTypes.func.isRequired,
      onRemoveAttachment: PropTypes.func.isRequired,
      contactFormSubmitted: PropTypes.bool.isRequired,
      contactFormDisabled: PropTypes.bool.isRequired,
      submitInProgress: PropTypes.bool.isRequired,
      viewStyles: PropTypes.shape({
        fontFamily: PropTypes.string
      }),
      fullPrivacyEnabled: PropTypes.bool,
      keyboardInteractionIsActive: PropTypes.bool.isRequired,
      /**
       * Allowed file mime types list
       */
      attachmentsWhitelist: PropTypes.array.isRequired
    },

    getInitialState() {
      return {
        blockingErrorIsVisible: false
      };
    },

    render() {
      const {
        text,
        showCloseButton,
        onMinimizeConversation,
        onKeyDown,
        onClick,
        contactFormDetails,
        viewStyles,
        fullPrivacyEnabled,
        offlineBehaviour,
        contactFormSubmitted,
        contactFormDisabled,
        allowFullScreen,
        submitInProgress,
        keyboardInteractionIsActive,
        attachmentsWhitelist
      } = this.props;

      const {featureIsEnabled} = contactFormDetails.attachmentsMeta;
      const attachmentIsEnabled = featureIsEnabled && !fullPrivacyEnabled;
      const viewClasses = classes("hs-view", {
        "outline-hidden": !keyboardInteractionIsActive
      });

      return (
        <div className={viewClasses} style={viewStyles} onKeyDown={onKeyDown} onClick={onClick}>
          <ErrorBoundaryWithLogging fallbackComponent={this._renderHeaderFallback()}>
            <ViewHeader
              title={text.businessHoursViewHeader}
              showCloseBtn={showCloseButton}
              onCloseBtnClick={onMinimizeConversation}
            />
          </ErrorBoundaryWithLogging>
          <ErrorBoundaryWithLogging
            fallbackComponent={<AppError />}
            onError={this._handleViewContentsError}>
            <BusinessHoursViewContents
              text={text}
              attachmentIsEnabled={attachmentIsEnabled}
              onFilesChange={this._onFilesChange}
              offlineBehaviour={offlineBehaviour}
              contactFormSubmitted={contactFormSubmitted}
              contactFormDisabled={contactFormDisabled}
              allowFullScreen={allowFullScreen}
              onMinimizeConversation={onMinimizeConversation}
              contactFormDetails={contactFormDetails}
              fullPrivacyEnabled={fullPrivacyEnabled}
              submitInProgress={submitInProgress}
              onSendButtonClick={this._onSendButtonClick}
              onNameChange={this._onNameChange}
              onMessageChange={this._onMessageChange}
              onEmailChange={this._onEmailChange}
              onRemoveAttachmentClick={this._onRemoveAttachmentClick}
              setAxActiveIndex={this._setAxActiveIndex}
              attachmentsWhitelist={attachmentsWhitelist}
            />
          </ErrorBoundaryWithLogging>
        </div>
      );
    },

    _renderHeaderFallback() {
      if (this.state.blockingErrorIsVisible) {
        return null;
      }

      return <NonBlockingError />;
    },

    /**
     * Change handler for name
     * @param {Object} ev - change event of name input field
     */
    _onNameChange(ev) {
      this.props.onChangeBusinessHoursContactFormDetails(NAME, ev.target.value);
    },

    /**
     * Change handler for email
     * @param {Object} ev - change event of email input field
     */
    _onEmailChange(ev) {
      this.props.onChangeBusinessHoursContactFormDetails(EMAIL, ev.target.value);
    },

    /**
     * Change handler for message
     * @param {Object} ev - change event of message text area
     */
    _onMessageChange(ev) {
      this.props.onChangeBusinessHoursContactFormDetails(MESSAGE, ev.target.value);
    },

    /**
     * Click handler for 'Send' button
     */
    _onSendButtonClick(ev) {
      this._setAxActiveIndex(
        {
          selector: METALIST_ITEMS.OOBH.FOOTER_BTN.SELECTOR
        },
        ev
      );
      this.props.onSubmitBusinessHoursContactForm();
    },

    /**
     * Click handler for 'X' icon of attachment
     * @param {String} attachmentId - attachment id to remove
     * @param {String} dataLabelAttribute - attachment data label
     * @param {Object} ev - Click event object
     */
    _onRemoveAttachmentClick(attachmentId, dataLabelAttribute, ev) {
      const {attachmentsWhitelist} = this.props;

      this._setAxActiveIndex(
        {
          selector: `[data-label=${dataLabelAttribute}]`
        },
        ev
      );

      this.props.onRemoveAttachment(attachmentId, attachmentsWhitelist);
    },

    /**
     * Change handler for files select
     */
    _onFilesChange(ev) {
      const {onFilesChange, attachmentsWhitelist} = this.props;

      onFilesChange(ev, attachmentsWhitelist);
    },

    _handleViewContentsError() {
      this.setState({
        blockingErrorIsVisible: true
      });
    },

    /**
     * This function is called on focus or click event on element
     * It calls ax function to update active index
     *
     * @param {Object} config.name - Selector value
     * @param {Object} ev - Click or focus event object
     */
    _setAxActiveIndex(config, ev) {
      // When the user click on an interactive element, event propagates
      // to global event, which sets the keyboardInteractionIsActive flag
      // to false which hides the focus outline. In case of focus event, if we
      // do not stop the propagation of the event, then the parent component
      // will listen to it and also set its ax active index.
      if (ev && ev.type !== "click") {
        ev.stopPropagation();
      }

      ax.setActiveIndex(config);
    },

    /**
     * Clear delayed focus on componentDidUpdate to clear batched focus items
     * Ex - When an attachment is removed, all attachments are re-rendered.
     * Wait for the dom to update & then focus the next attachment element
     */
    componentDidUpdate() {
      ax.clearDelayFocus();
    },

    componentDidMount() {
      const {offlineBehaviour} = this.props;

      ax.setActiveView(activeViewConstants.BUSINESS_HOURS);

      if (offlineBehaviour !== CONTACT_FORM) {
        ax.replaceMetaList(OOBH_SUBVIEW.OFFLINE_MSG);
      } else {
        ax.replaceMetaList(OOBH_SUBVIEW.FORM);
      }

      ax.focus();
    }
  });
});
