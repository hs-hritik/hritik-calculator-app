/**
 * Message Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/message",
  [
    "constants/propTypes",
    "constants/message",
    "constants/errors",
    "helpers/attachments",
    "gunpowder/utils/date",
    "gunpowder/utils/classes",
    "gunpowder/utils/object"
  ],
  function (PROP_TYPES, MESSAGE_CONSTANTS, ERROR_CONSTANTS,
    attachmentsHelpers, dateUtils, classes, objUtils) {
    "use strict";

    const MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE;
    const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "bmp"];

    const {FILE_UPLOAD_ERRORS} = ERROR_CONSTANTS;

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "Message",
      propTypes: {
        message: PropTypes.shape (PROP_TYPES.MESSAGE).isRequired,
        showAgentNickname: PropTypes.bool,
        isLastMessage: PropTypes.bool,
        isLastMessageInGroup: PropTypes.bool,
        onSuggestedFaqClick: PropTypes.func,
        onStartCsatSurveyClick: PropTypes.func,
        onRetryAttachmentClick: PropTypes.func,
        text: PropTypes.shape ({
          faqSuggestionsMsgTitleSingle: PropTypes.string.isRequired,
          faqSuggestionsMsgTitleMultpile: PropTypes.string.isRequired,
          csatBotRequestMsg: PropTypes.string.isRequired,
          csatLinkCaption: PropTypes.string.isRequired,
          attachmentRetryError: PropTypes.string.isRequired,
          attachmentFileSizeError: PropTypes.string.isRequired,
          attachmentDefaultError: PropTypes.string.isRequired
        }).isRequired
      },

      getDefaultProps () {
        return {
          showAgentNickname: false,
          isLastMessage: false
        };
      },

      render () {
        const {isCustomerMsg, type, states} = this.props.message;

        if (type === MESSAGE_TYPE.END_CHAT) {
          return this._renderEndChatMessage ();
        }

        const msgClasses = classes (
          "hs-message", {
            "hs-message--left": !isCustomerMsg,
            "hs-message--right": isCustomerMsg,
            "hs-message--no-padding": isCustomerMsg &&
                                      this._isAttachmentPreviewable (),
            "hs-message--error": states && states.error
          }
        );

        return (
          <div className={msgClasses}>
            {this._renderMessage ()}
            {this._renderAttachmentErrors ()}
            {this._renderMessageDetails ()}
          </div>
        );
      },

      /**
       * Render the message according to its type.
       */
      _renderMessage () {
        const {type} = this.props.message;

        switch (type) {
          case MESSAGE_TYPE.TEXT:
            return this._renderTextMessage ();

          case MESSAGE_TYPE.FAQ:
            return this._renderFaqMessage ();

          case MESSAGE_TYPE.CSAT:
            return this._renderCsatMessage ();

          case MESSAGE_TYPE.ATTACHMENT:
            return this._renderAttachmentMessage ();

          default:
            return null;
        }
      },

      /**
       * Render text message.
       */
      _renderTextMessage () {
        /* eslint-disable react/no-danger */
        return (
          <div className="hs-message__item" dir="auto">
            <div dangerouslySetInnerHTML={{__html: this.props.message.body}} />
            {this._renderAttachments ()}
          </div>
        );
        /* eslint-enable react/no-danger */
      },

      /**
       * Render message attachments
       */
      _renderAttachments () {
        const {attachments} = this.props.message;

        if (!(attachments && attachments.length)) {
          return null;
        }

        const attachmentsEl = attachments.map (this._renderAttachment);

        return (
          <div>
            {attachmentsEl}
          </div>
        );
      },

      /**
       * Render message attachment
       */
      _renderAttachment (attachment, index) {
        const formattedFileName = attachmentsHelpers.getFormattedFileName (
          attachment.fileName
        );
        const clickHandler = this._onAttachmentClick.bind (this, attachment.url);

        return (
          <div key={index} className="hs-attachment" onClick={clickHandler}>
            <i className="ion-attachment hs-attachment__icon" />
            <div className="hs-attachment__info-wrapper">
              <small title={attachment.fileName}>
                <strong>{formattedFileName}</strong>
              </small>
            </div>
          </div>
        );
      },

      /**
       * Render FAQ suggestions message.
       */
      _renderFaqMessage () {
        if (!this.props.message.suggestedFaqs.length) {
          return null;
        }

        const {text} = this.props;
        const msgTitle = (this.props.message.suggestedFaqs.length === 1) ?
                         text.faqSuggestionsMsgTitleSingle :
                         text.faqSuggestionsMsgTitleMultpile;

        return (
          <div className="hs-message__item">
            {msgTitle}
            <div className="hs-message__suggested-faqs">
              {this._renderFaqs ()}
            </div>
          </div>
        );
      },

      /**
       * Render an faq, which is a part of the faq message.
       */
      _renderFaqs () {
        const {suggestedFaqs} = this.props.message;

        return suggestedFaqs.map ((faq) => {
          return (
            <a key={faq.id}
               className="hs-message__suggested-faq"
               dir="auto"
               onClick={this.props.onSuggestedFaqClick.bind (this, faq.id)}>
              {faq.title}
              <i className="ion-chevron-right hs-message__suggested-faq-icon" />
            </a>
          );
        });
      },

      /**
       * Render csat request message.
       */
      _renderCsatMessage () {
        const {text} = this.props;

        // @TODO: Rename classes.
        return (
          <div className="hs-message__item">
            {text.csatBotRequestMsg}
            <div className="hs-message__suggested-faqs">
              <a className="hs-message__suggested-faq"
                 onClick={this.props.onStartCsatSurveyClick}>
                {text.csatLinkCaption}
                <i className="ion-chevron-right hs-message__suggested-faq-icon" />
              </a>
            </div>
          </div>
        );
      },

      /**
       * Render attachment message
       */
      _renderAttachmentMessage () {
        const {message} = this.props;
        const renderConfig = {
          name: "",
          url: "",
          iconClasses: "",
          retry: false,
          clickHandler: null
        };
        let attachmentEl = null;
        let attachmentIsPreviewable = false;

        // Attacment message is frontend/dummy message
        if (message.isSystemMsg) {
          renderConfig.name = message.file.name;
          attachmentIsPreviewable = this._isAttachmentPreviewable (
            renderConfig.name
          );

          // If attachment message is uploading, set loading icons
          if (message.states.uploadInProgress) {
            renderConfig.iconClasses = classes (
              "ion-load-b",
              "ion--spinning"
            );
          } else if (message.states.error) {
            // If attachment message has errors, set icon classes depending on
            // error code. Also attach retry click handler in case of failure is
            // retryable.
            const errorCode = message.states.errorCode;
            const failureIsRetryable = (errorCode === FILE_UPLOAD_ERRORS.RETRY);

            if (failureIsRetryable) {
              renderConfig.onClick = this._onRetryClick;
            }

            renderConfig.iconClasses = classes ({
              "hs-message__failed-img-icon": attachmentIsPreviewable,
              "hs-message__icon-error": !attachmentIsPreviewable,
              "ion-alert-circled": !failureIsRetryable,
              "ion-reset": failureIsRetryable
            });
          }
        } else {
          // Attacment message is backend message
          const attachment = message.attachments [0];
          renderConfig.name = attachment.fileName;
          renderConfig.url = attachment.url;
          renderConfig.iconClasses = "ion-attachment";
          attachmentIsPreviewable = this._isAttachmentPreviewable (
            renderConfig.name
          );
        }

        if (attachmentIsPreviewable) {
          attachmentEl = this._renderPreviewableAttachment (renderConfig);
        } else {
          attachmentEl = this._renderNonPreviewableAttachment (renderConfig);
        }

        return (
          <div className="hs-message__item">
            {attachmentEl}
          </div>
        );
      },

      /**
       * Render previewable attachment
       * @param {Object} config - render config object
       * @property {String} config.url - attachment url
       * @property {Function} config.onClick - attachment layout click handler
       */
      _renderPreviewableAttachment (config) {
        const {url, iconClasses, onClick} = config;
        const formattedFileName = attachmentsHelpers.getFormattedFileName (
          config.name
        );

        // @TODO :- Get alt text from designers
        // Render uploaded image
        if (url) {
          return (
            <img src={url} alt={formattedFileName} />
          );
        }

        // Render local image
        return (
          <div onClick={onClick}>
            <img ref={this._saveImageRef} className="hs-message__failed-img" />
            <i className={iconClasses} />
          </div>
        );
      },

      /**
       * Render non previewable attachment
       * @param {Object} config - render config object
       * @param {String} config.name - attachment name
       * @param {String} config.iconClasses - attachment icon classes
       * @param {Function} config.onClick - attachment layout click handler
       */
      _renderNonPreviewableAttachment (config) {
        const {name, iconClasses, onClick} = config;

        return (
          <div className="hs-message__user-attachment" onClick={onClick}>
            <i className={iconClasses} />
            <span title={name}>{attachmentsHelpers.getFormattedFileName (name)}</span>
          </div>
        );
      },

      /**
       * Render end chat message.
       */
      _renderEndChatMessage () {
        // @TODO: Show agent nickname when we get the assignee from the backend.
        return (
          <div className="hs-message hs-message--end-chat">
            Chat Ended
          </div>
        );
      },

      /**
       * Render attachment errors
       */
      _renderAttachmentErrors () {
        const {message} = this.props;

        let attachmentsErrorEl = null;

        if (message.type === MESSAGE_TYPE.ATTACHMENT && message.isSystemMsg &&
            message.states.error) {
          const errorText = this._getAttachmentErrorMessage (message.states.errorCode);

          attachmentsErrorEl = (
            <div className="hs-message__attachment-error">
              <small>{errorText}</small>
            </div>
          );
        }

        return attachmentsErrorEl;
      },

      /**
       * Render agent name and message timestamp.
       */
      _renderMessageDetails () {
        // Don't render message details for end chat message.
        if (this.props.message.type === MESSAGE_TYPE.END_CHAT) {
          return null;
        }

        return (
          <div className="hs-message__details">
            <div className="hs-message__agent-nickname">
              {this._getAgentNickname ()}
            </div>
            <div className="hs-message__time-ago">
              {this._getTimeAgo ()}
            </div>
          </div>
        );
      },

      /**
       * Get agent nickname.
       */
      _getAgentNickname () {
        const {message, showAgentNickname} = this.props;

        if (!showAgentNickname ||
            message.isCustomerMsg ||
            message.isSystemMsg ||
            !this.props.isLastMessageInGroup) {
          return null;
        }

        return objUtils.getIn (message, ["author", "name"]);
      },

      /**
       * Get time ago.
       */
      _getTimeAgo () {
        if (!this.props.isLastMessage) {
          return null;
        }

        const {message} = this.props;
        const timeAgoMs = Date.now () - message.createdTs;
        let timeAgoStr;

        // If the message came in the last one minute, show "just now".
        if (timeAgoMs < 60000) {
          timeAgoStr = "just now";
        } else {
          timeAgoStr = dateUtils.humanizeDuration (timeAgoMs, {
            shortForm: true,
            maxUnits: 1
          });
        }

        return timeAgoStr;
      },

      /**
       * Click handler for attachment
       */
      _onAttachmentClick (url) {
        window.open (url);
      },

      /**
       * Returns error text depending on error code
       * @param {Number} errorCode - error code of failure
       * @returns {String} - error text
       */
      _getAttachmentErrorMessage (errorCode) {
        const {text} = this.props;
        let errorText;

        switch (errorCode) {
          case FILE_UPLOAD_ERRORS.RETRY:
            errorText = text.attachmentRetryError;
            break;

          case FILE_UPLOAD_ERRORS.SIZE_EXCEEDED:
            errorText = text.attachmentFileSizeError;
            break;

          default:
            errorText = text.attachmentDefaultError;
            break;
        }

        return errorText;
      },

      /**
       * Predicate to check if attachment is of type image
       * @param {String} name - attachment file name
       * @returns {Boolean} - attachment is of type image
       */
      _isImageAttachment (name) {
        const {message} = this.props;

        if (message.type !== MESSAGE_TYPE.ATTACHMENT) {
          return false;
        }

        if (!name) {
          name = message.file ? message.file.name :
                 message.attachments [0].fileName;
        }

        // If file does not contain any extension
        if (name.indexOf (".") === -1) {
          return false;
        }

        const dotIndex = name.lastIndexOf (".") + 1;
        const fileExt = name.substr (dotIndex, name.length).toLowerCase ();

        return IMAGE_EXTENSIONS.indexOf (fileExt) !== -1;
      },

      /**
       * Predicate to check if attachment is previewable
       * @param {String} name - attachment file name
       * @returns {Boolean} - attachment is previewable
       */
      _isAttachmentPreviewable (name) {
        const {message} = this.props;

        if (message.type !== MESSAGE_TYPE.ATTACHMENT) {
          return false;
        }

        const isImageAttachment = this._isImageAttachment (name);
        const localAttachmentHasError = message.isSystemMsg ?
                                        message.states.error : true;

        // For any attachment to be previewable
        // a] The type of attachment must be of type image and
        // b] If it is local image, it should have error
        //    Do not show preview while uploading!
        return (isImageAttachment && localAttachmentHasError);
      },

      /**
       * Reference for image tag
       */
      _imgRef: null,

      /**
       * Save image reference
       * @param {Object} ref - DOM reference of image
       */
      _saveImageRef (ref) {
        this._imgRef = ref;
      },

      /**
       * Preview attachment
       */
      _previewAttachment () {
        const {message} = this.props;

        if (!this._imgRef || !message.isSystemMsg) {
          return;
        }

        const file = message.file;
        const reader = new FileReader();
        reader.readAsDataURL (file);
        reader.onload = (ev) => {
          // @TODO :- check if image ref has already set src
          this._imgRef.src = ev.target.result;
        };
      },

      /**
       * Click handler for retry attachment
       */
      _onRetryClick () {
        const {message} = this.props;
        this.props.onRetryAttachmentClick (message);
      },

      componentDidUpdate () {
        this._previewAttachment ();
      }
    });
  }
);
