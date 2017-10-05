/**
 * Business Hours View.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 3, 2017
 */

define ("components/businessHoursView",
  [
    "components/commons/viewHeader",
    "components/commons/branding",
    "constants/businessHoursView",
    "gunpowder/utils/classes"
  ],
  function (ViewHeader, Branding, BUSINESS_HOURS_CONTANTS, classes) {
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

    const {NAME, EMAIL, MESSAGE} = BUSINESS_HOURS_CONTANTS.CONTACT_FORM_FIELDS;

    return React.createClass ({
      displayName: "BusinessHoursView",
      propTypes: {
        browserIsMobile: PropTypes.bool.isRequired,
        text: PropTypes.shape ({
          // @TODO :- Replace this with business hours header text
          chatViewHeader: PropTypes.string.isRequired
        }).isRequired,
        contactFormDetails: PropTypes.shape ({
          name: FORM_FIELD_PROP_TYPE,
          email: FORM_FIELD_PROP_TYPE,
          message: FORM_FIELD_PROP_TYPE
        }).isRequired,
        onMinimizeConversation: PropTypes.func.isRequired,
        onChangeBusinessHoursContactFormDetails: PropTypes.func.isRequired,
        onSubmitBusinessHoursContactForm: PropTypes.func.isRequired
      },
      render () {
        const {text, browserIsMobile, onMinimizeConversation} = this.props;
        // @TODO :- Add following
        // 1] Add business hours note
        // 2] Add error icon on formfield

        return (
          <div className="hs-view">
            <ViewHeader title={text.chatViewHeader}
                        showCloseBtn={browserIsMobile}
                        onCloseBtnClick={onMinimizeConversation} />
            <div className="hs-view__content">
              <div className="hs-business-hours">
                <div>
                  <p>
                    We are currently out of business hours.
                  </p>
                  {this._renderFormField (NAME)}
                  {this._renderFormField (EMAIL)}
                  {this._renderFormField (MESSAGE)}
                  <Branding text={text} />
                </div>

                <div className="hs-business-hours__submit-btn-wrapper">
                  <button className="hs-business-hours__submit-btn hs-button"
                          onClick={this._onSendButtonClick} >
                    Send
                  </button>
                </div>
              </div>
            </div>
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

        const {text} = this.props;
        let formFieldLabel = "";
        let inputEl = null;

        switch (fieldName) {
          case NAME:
            formFieldLabel = text.businessHoursNameLabel;
            inputEl = (
              <input type="text"
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

        return (
          <div className={formFieldClasses}>
            <div className="hs-form-field__label">{formFieldLabel}</div>
            {inputEl}
          </div>
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
      }
    });
  }
);
