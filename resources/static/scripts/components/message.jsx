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
  function (customPropTypes, MESSAGE_CONSTANTS, ERROR_CONSTANTS, attachmentsHelpers,
    dateUtils, classes, objUtils) {
    "use strict";

    const {TYPE: MESSAGE_TYPE} = MESSAGE_CONSTANTS;
    const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "bmp"];

    const {FILE_UPLOAD_ERRORS} = ERROR_CONSTANTS;

    const IMAGE_MSG_MAX_HEIGHT = 170;

    const AGENT_NAME_SEPARATOR = ", ";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "Message",
      propTypes: {
        message: customPropTypes.MESSAGE_PROP_TYPE,
        showAgentNickname: PropTypes.bool,
        isLastMessage: PropTypes.bool,
        isLastMessageInGroup: PropTypes.bool,
        onSuggestedFaqClick: PropTypes.func,
        onRetryAttachmentClick: PropTypes.func,
        onImageLoad: PropTypes.func,
        text: PropTypes.shape ({
          csatBotRequestMsg: PropTypes.string.isRequired,
          attachmentRetryError: PropTypes.string.isRequired,
          attachmentFileSizeError: PropTypes.string.isRequired,
          attachmentDefaultError: PropTypes.string.isRequired,
          attachmentUploadingStatus: PropTypes.string.isRequired
        }).isRequired
      },

      getDefaultProps () {
        return {
          showAgentNickname: false,
          isLastMessage: false
        };
      },

      getInitialState () {
        return {
          imageWrapperHeight: IMAGE_MSG_MAX_HEIGHT,
          imageLoaded: false,
          localImageData: null
        };
      },

      render () {
        const {isCustomerMsg, type, states} = this.props.message;

        if (type === MESSAGE_TYPE.SYSTEM_INFO) {
          return this._renderSystemInfoMessage ();
        }

        const msgClasses = classes (
          "hs-message", {
            "hs-message--left": !isCustomerMsg,
            "hs-message--right": isCustomerMsg,
            "hs-message--image-attachment": isCustomerMsg &&
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

        // @NOTE - All bot messages (except faqs) and user response messages
        // are rendered as text messages
        switch (type) {
          case MESSAGE_TYPE.TEXT:
          case MESSAGE_TYPE.TEXT_MSG_WITH_TEXT_INPUT:
          case MESSAGE_TYPE.TEXT_MSG_WITH_EMAIL_INPUT:
          case MESSAGE_TYPE.TEXT_MSG_WITH_NUMERIC_INPUT:
          case MESSAGE_TYPE.TEXT_MSG_WITH_DATE_TIME_INPUT:
          case MESSAGE_TYPE.TEXT_MSG_WITH_OPTION_INPUT:
          case MESSAGE_TYPE.RESP_TEXT_MSG_WITH_TEXT_INPUT:
          case MESSAGE_TYPE.RESP_TEXT_MSG_WITH_EMAIL_INPUT:
          case MESSAGE_TYPE.RESP_TEXT_MSG_WITH_NUMERIC_INPUT:
          case MESSAGE_TYPE.RESP_TEXT_MSG_WITH_DATE_TIME_INPUT:
          case MESSAGE_TYPE.RESP_TEXT_MSG_WITH_OPTION_INPUT:
          case MESSAGE_TYPE.RESP_EMPTY_MSG_WITH_TEXT_INPUT:
          case MESSAGE_TYPE.RESP_FAQ_LIST_WITH_OPTION_INPUT:
            return this._renderTextMessage ();

          case MESSAGE_TYPE.FAQ_LIST_WITH_OPTION_INPUT:
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
            {this._renderAgentAttachments ()}
          </div>
        );
        /* eslint-enable react/no-danger */
      },

      /**
       * Render agent message attachments
       */
      _renderAgentAttachments () {
        const {attachments} = this.props.message;

        if (!(attachments && attachments.length)) {
          return null;
        }

        const attachmentsEl = attachments.map (this._renderAgentAttachment);

        return (
          <div>
            {attachmentsEl}
          </div>
        );
      },

      /**
       * Render agent message attachment
       */
      _renderAgentAttachment (attachment, index) {
        const formattedFileName = attachmentsHelpers.getFormattedFileName (
          attachment.fileName
        );
        const clickHandler = this._onAttachmentClick.bind (this, attachment.url);

        return (
          <div key={index} className="hs-attachment" onClick={clickHandler}>
            <i className="ion-attachment" />
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
        const {
          body,
          suggestedFaqs
        } = this.props.message;

        if (!suggestedFaqs.length) {
          return null;
        }

        return (
          <div className="hs-message__item">
            {body}
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
        const {
          onSuggestedFaqClick,
          message: {
            suggestedFaqs
          }
        } = this.props;

        return suggestedFaqs.map ((faq) => {
          return (
            <span key={faq.id}
                  className="hs-message__suggested-faq"
                  dir="auto"
                  onClick={onSuggestedFaqClick.bind (this, faq.id)}>
              {faq.title}
              <i className="ion-chevron-right hs-message__suggested-faq-icon" />
            </span>
          );
        });
      },

      /**
       * Render csat request message.
       */
      _renderCsatMessage () {
        return (
          <div className="hs-message__item">
            {this.props.text.csatBotRequestMsg}
          </div>
        );
      },

      /**
       * Render attachment message
       */
      _renderAttachmentMessage () {
        const {
          message: {
            isSystemMsg,
            states: messageStates,
            file,
            attachments
          }
        } = this.props;

        let attachmentEl = null;
        let attachmentIsPreviewable = false;

        // Attachment message is a frontend/dummy message
        if (isSystemMsg) {
          this._attachmentRenderConfig.name = file.name;
          attachmentIsPreviewable = this._isAttachmentPreviewable ();

          // If attachment message is uploading, set loading icons
          if (messageStates.uploadInProgress) {
            this._attachmentRenderConfig.iconClasses = classes (
              "ion-load-b",
              "ion--spinning"
            );
          } else if (messageStates.error) {
            // If attachment message has errors, set icon classes depending on
            // error code. Also attach retry click handler in case of failure is
            // retryable.
            const errorCode = messageStates.errorCode;
            const failureIsRetryable = (errorCode === FILE_UPLOAD_ERRORS.RETRY);

            if (failureIsRetryable) {
              this._attachmentRenderConfig.onClick = this._onRetryClick;
            } else {
              this._attachmentRenderConfig.onClick = null;
            }

            this._attachmentRenderConfig.iconClasses = classes (
              "hs-message__icon-error", {
                "ion-alert-circled": !failureIsRetryable,
                "ion-reset": failureIsRetryable
              }
            );
          } else {
            this._attachmentRenderConfig.iconClasses = "";
          }
        } else {
          // Attachment message is a backend message
          const attachment = attachments [0];

          this._attachmentRenderConfig.name = attachment.fileName;
          this._attachmentRenderConfig.url = attachment.url;
          this._attachmentRenderConfig.iconClasses = "ion-attachment";

          attachmentIsPreviewable = this._isAttachmentPreviewable ();
        }

        if (attachmentIsPreviewable) {
          attachmentEl = this._renderPreviewableAttachment ();
        } else {
          attachmentEl = this._renderNonPreviewableAttachment ();
        }

        return (
          <div className="hs-message__item hs-message__attachment">
            {attachmentEl}
          </div>
        );
      },

      /**
       * Render previewable attachment
       */
      _renderPreviewableAttachment () {
        // @TODO :- Get alt text from designers
        // Render uploaded image
        if (this._attachmentRenderConfig.url) {
          return this._renderUploadedImage ();
        }
        // Render local image
        return this._renderLocalImage ();
      },

      /**
       * Render uploaded image
       */
      _renderUploadedImage () {
        const {url} = this._attachmentRenderConfig;

        const clickHandler = this._onAttachmentClick.bind (this, url);
        const wrapperStyles = {
          backgroundImage: `url(${url})`,
          height: `${this.state.imageWrapperHeight}px`
        };
        let imageEl = null;

        if (!this.state.imageLoaded) {
          imageEl = (
            <img className="hs-message__height-finder"
                 src={url}
                 onLoad={this._onImageLoad} />
          );
        }

        return (
          <div style={wrapperStyles}
               className="hs-message__image-wrapper"
               onClick={clickHandler}>
            {imageEl}
          </div>
        );
      },

      /**
       * Render local image
       */
      _renderLocalImage () {
        const {onClick} = this._attachmentRenderConfig;

        const bgImg = this.state.localImageData ?
                      `url(${this.state.localImageData})` : "none";
        let imageEl = null;

        if (!this.state.imageLoaded) {
          const imageProps = {
            ref: this._saveLocalImageRef,
            className: "hs-message__height-finder"
          };

          if (this.state.localImageData) {
            imageProps.src = this.state.localImageData;
            imageProps.onLoad = this._onImageLoad;
          }

          imageEl = (
            <img {...imageProps} />
          );
        }

        const wrapperStyles = {
          backgroundImage: bgImg,
          height: `${this.state.imageWrapperHeight}px`
        };

        return (
          <div onClick={onClick}>
            <div ref={this._saveLocalImageWrapperRef}
                 style={wrapperStyles}
                 className="hs-message__image-wrapper hs-message__failed-img">
             {imageEl}
            </div>
          </div>
        );
      },

      /**
       * Render non previewable attachment
       */
      _renderNonPreviewableAttachment () {
        const {name, iconClasses, onClick, url} = this._attachmentRenderConfig;

        let wrapperClickHandler;

        if (!this.props.message.isSystemMsg) {
          wrapperClickHandler = this._onAttachmentClick.bind (this, url);
        } else {
          wrapperClickHandler = onClick;
        }

        return (
          <div className="hs-message__user-attachment" onClick={wrapperClickHandler}>
            <i className={iconClasses} />
            <span title={name}>{attachmentsHelpers.getFormattedFileName (name)}</span>
          </div>
        );
      },

      /**
       * Render system info message.
       */
      _renderSystemInfoMessage () {
        return (
          <div className="hs-message hs-message--system-info">
            {this.props.message.body}
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
          const errorTextEl = this._getAttachmentErrorMessageEl (message.states.errorCode);

          attachmentsErrorEl = (
            <div className="hs-message__attachment-error">
              {errorTextEl}
            </div>
          );
        }

        return attachmentsErrorEl;
      },

      /**
       * Render agent name and message timestamp.
       */
      _renderMessageDetails () {
        const agentName = this._getAgentNickname ();
        const time = this._getHumanReadableTime ();
        let details = time;

        if (agentName) {
          details = agentName + AGENT_NAME_SEPARATOR + time;
        }

        return (
          <div className="hs-message__details">
            {details}
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
       * Get human readable time
       */
      _getHumanReadableTime () {
        const {
          message: {
            type: messageType,
            states: messageStates,
            createdTs
          },
          text
        } = this.props;

        // If the message is of type attachment and it's uploading at the moment,
        // show `Uploading..` and return.
        if (messageType === MESSAGE_TYPE.ATTACHMENT &&
            messageStates &&
            messageStates.uploadInProgress) {
          return text.attachmentUploadingStatus;
        }

        return dateUtils.format (createdTs, "{hh}:{MM} {a}");
      },

      /**
       * Load handler for image tag
       */
      _onImageLoad (ev) {
        const imageHeight = ev.target.clientHeight;
        if (imageHeight < IMAGE_MSG_MAX_HEIGHT) {
          // Set height of parent div
          this.setState ({
            imageWrapperHeight: imageHeight
          });
        }
        if (this.props.onImageLoad) {
          this.props.onImageLoad ();
        }
        this.setState ({
          imageLoaded: true
        });
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
       * @returns {Element} - The attachment error message element
       */
      _getAttachmentErrorMessageEl (errorCode) {
        const {text} = this.props;
        const {iconClasses} = this._attachmentRenderConfig;
        let errorTextEl;

        switch (errorCode) {
          case FILE_UPLOAD_ERRORS.RETRY:
            errorTextEl = [
              <i className={iconClasses} />,
              <small>
                {text.attachmentRetryError}
              </small>
            ];
            break;

          case FILE_UPLOAD_ERRORS.SIZE_EXCEEDED:
            errorTextEl = [
              <i className={iconClasses} />,
              <small>
                {text.attachmentFileSizeError}
              </small>
            ];
            break;

          default:
            errorTextEl = [
              <i className={iconClasses} />,
              <small>
                {text.attachmentDefaultError}
              </small>
            ];
            break;
        }

        return errorTextEl;
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
      _isAttachmentPreviewable () {
        const {message} = this.props;

        if (message.type !== MESSAGE_TYPE.ATTACHMENT) {
          return false;
        }

        const isImageAttachment = this._isImageAttachment (
          this._attachmentRenderConfig.name
        );
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
      _localImgWrapperRef: null,

      _localImgRef: null,

      _attachmentRenderConfig: {
        name: "",
        url: "",
        iconClasses: "",
        retry: false,
        onClick: null
      },

      /**
       * Save local image wrapper reference
       * @param {Object} ref - DOM reference of image
       */
      _saveLocalImageWrapperRef (ref) {
        this._localImgWrapperRef = ref;
      },

      /**
       * Save local image reference
       * @param {Object} ref - DOM reference of image
       */
      _saveLocalImageRef (ref) {
        this._localImgRef = ref;
      },

      /**
       * Flag to represent local image is picked up by file reader
       */
      _fileRead: false,

      /**
       * Preview attachment
       */
      _previewAttachment () {
        const {message} = this.props;
        if (!this._localImgWrapperRef || !message.isSystemMsg ||
            this._fileRead) {
          return;
        }

        this._fileRead = true;

        const file = message.file;
        const reader = new FileReader();
        reader.readAsDataURL (file);
        reader.onload = (ev) => {
          // @TODO :- check if image ref has already set src
          this.setState ({
            localImageData: ev.target.result
          });
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

        // Reset attachment render config for the next render.
        this._attachmentRenderConfig = {
          name: "",
          url: "",
          iconClasses: "",
          retry: false,
          onClick: null
        };
      }
    });
  }
);
