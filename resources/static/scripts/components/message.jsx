/**
 * Message Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define("components/message", [
  "constants/propTypes",
  "constants/message",
  "constants/errors",
  "helpers/attachments",
  "gunpowder/utils/date",
  "gunpowder/utils/classes",
  "gunpowder/utils/object",
  "helpers/common",
  "extras/accessibility"
], function(
  customPropTypes,
  MESSAGE_CONSTANTS,
  ERROR_CONSTANTS,
  attachmentsHelpers,
  dateUtils,
  classes,
  objUtils,
  commonHelper,
  ax
) {
  "use strict";

  const {TYPE: MESSAGE_TYPE} = MESSAGE_CONSTANTS;
  const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "bmp"];

  const {FILE_UPLOAD_ERRORS} = ERROR_CONSTANTS;

  const IMAGE_MSG_MAX_HEIGHT = 170;

  const AGENT_NAME_SEPARATOR = ", ";

  return createReactClass({
    displayName: "Message",
    propTypes: {
      message: customPropTypes.MESSAGE_PROP_TYPE,
      showAgentNickname: PropTypes.bool,
      isLastMessage: PropTypes.bool,
      // @NOTE - isLastMessageInGroup will be used for message grouping in future, so
      // keeping this prop as it is.
      isLastMessageInGroup: PropTypes.bool,
      onSuggestedFaqClick: PropTypes.func,
      onRetryAttachmentClick: PropTypes.func,
      onImageLoad: PropTypes.func,
      text: PropTypes.shape({
        csatBotRequestMsg: PropTypes.string.isRequired,
        messageDeleted: PropTypes.string.isRequired,
        conversationRedactedMsg: PropTypes.string.isRequired,
        conversationsRedactedMsg: PropTypes.string.isRequired,
        attachmentRetryError: PropTypes.string.isRequired,
        attachmentFileSizeError: PropTypes.string.isRequired,
        attachmentFileTypeError: PropTypes.string.isRequired,
        attachmentDefaultError: PropTypes.string.isRequired,
        attachmentUploadingStatus: PropTypes.string.isRequired,
        ariaLabelSupportMsgAgentName: PropTypes.string,
        ariaLabelSupportMsgMissingAgentName: PropTypes.string,
        ariaLabelAttachmentUploading: PropTypes.string,
        ariaLabelUserMessage: PropTypes.string,
        conversationClosed: PropTypes.string,
        ariaLabelOpenFile: PropTypes.string
      }).isRequired
    },

    getDefaultProps() {
      return {
        showAgentNickname: false,
        isLastMessage: false
      };
    },

    getInitialState() {
      return {
        imageWrapperHeight: IMAGE_MSG_MAX_HEIGHT,
        imageLoaded: false,
        localImageData: null
      };
    },

    render() {
      const {isCustomerMsg, type, states, body} = this.props.message;
      const {
        ariaLabelSupportMsgAgentName,
        ariaLabelSupportMsgMissingAgentName,
        ariaLabelAttachmentUploading,
        ariaLabelUserMessage
      } = this.props.text;

      if (type === MESSAGE_TYPE.CHAT_SEPARATOR) {
        return this._renderChatSeparator();
      } else if (type === MESSAGE_TYPE.CONVERSATION_REDACTED) {
        return this._renderConversationRedactionMsg();
      }

      const msgClasses = classes("hs-message", {
        "hs-message--left": !isCustomerMsg,
        "hs-message--right": isCustomerMsg,
        "hs-message--image-attachment": isCustomerMsg && this._isAttachmentPreviewable(),
        "hs-message--error": states && states.error
      });
      const time = this._getHumanReadableTime();
      let msgLabel;

      if (!isCustomerMsg) {
        const agentName = this._getAgentNickname();

        if (agentName) {
          msgLabel = ariaLabelSupportMsgAgentName.replace("{{message}}", body);
          msgLabel = msgLabel.replace("{{agent_name}}", agentName);
          msgLabel = msgLabel.replace("{{time_and_date}}", time);
        } else {
          msgLabel = ariaLabelSupportMsgMissingAgentName.replace("{{message}}", body);
          msgLabel = msgLabel.replace("{{time_and_date}}", time);
        }
      } else if (states.uploadInProgress) {
        msgLabel = ariaLabelAttachmentUploading;
      } else {
        msgLabel = ariaLabelUserMessage.replace("{{message}}", body);
        msgLabel = msgLabel.replace("{{time_and_date}}", time);
      }

      return (
        <div className={msgClasses} onClick={this._onMsgClick} aria-label={msgLabel}>
          {this._renderMessage()}
          {this._renderAttachmentErrors()}
          {this._renderMessageDetails()}
        </div>
      );
    },

    /**
     * Render the message according to its type.
     */
    _renderMessage() {
      const {type, attachments, suggestedFaqs} = this.props.message;
      // Vo reads inside the msg bubble div, if any attachment or faq inside the body
      // Otherwise inner div is hidden to avoid repetition during voice over
      const ariaContainerIsHidden = !(suggestedFaqs || attachments);
      let messageItemEl = null;

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
          messageItemEl = this._renderServerMessage();
          break;

        case MESSAGE_TYPE.FAQ_LIST_WITH_OPTION_INPUT:
          messageItemEl = this._renderFaqMessage();
          break;

        case MESSAGE_TYPE.CSAT:
          messageItemEl = this._renderCsatMessage();
          break;

        case MESSAGE_TYPE.ATTACHMENT:
          messageItemEl = this._renderUserAttachmentMessage();
          break;
      }

      if (messageItemEl) {
        return (
          <div className="hs-message__item-wrapper" aria-hidden={ariaContainerIsHidden}>
            {messageItemEl}
          </div>
        );
      }

      return null;
    },

    /**
     * Render server text and attachment(bots & agent) message
     */
    _renderServerMessage() {
      let textMessageEl;

      const {
        message: {redacted, body},
        text: {messageDeleted}
      } = this.props;

      if (redacted) {
        // Redaction message is a plain text and needs
        // to be shown in italics.
        textMessageEl = <em className="hs-message--redacted">{messageDeleted}</em>;
      } else {
        /* eslint-disable react/no-danger */
        textMessageEl = <div dangerouslySetInnerHTML={{__html: body}} />;
        /* eslint-enable react/no-danger */
      }

      return (
        <div className="hs-message__item" dir="auto">
          {textMessageEl}
          {this._renderServerAttachments()}
        </div>
      );
    },

    /**
     * Render agent or bot message attachments
     */
    _renderServerAttachments() {
      const {attachments} = this.props.message;

      if (!(attachments && attachments.length)) {
        return null;
      }

      const attachmentsEl = attachments.map((attachment, index) => {
        const {url, fileName} = attachment;
        const attachmentIsPreviewable = this._isImageAttachment(url, fileName);

        if (attachmentIsPreviewable) {
          return this._renderServerPreviewableAttachment(attachment, index);
        }

        return this._renderServerNonPreviewableAttachment(attachment, index);
      });

      return <div>{attachmentsEl}</div>;
    },

    _renderConversationRedactionMsg() {
      const {
        text: {conversationRedactedMsg, conversationsRedactedMsg},
        message: {redactionCount}
      } = this.props;

      const body =
        redactionCount && redactionCount > 1
          ? conversationsRedactedMsg.replace("%d", redactionCount)
          : conversationRedactedMsg;

      return (
        <div>
          <div className="hs-message__hr" />
          <div className="hs-message__conversation-redacted">
            <em>{body}</em>
          </div>
        </div>
      );
    },

    /**
     * Render server non-previewable attachment message
     * @param {Object} attachment - attachment to be rendered
     * @param {string} attachment.fileName - attachment name
     * @param {string} attachment.url - attachment url
     * @param {Number} index - attachment index
     */
    _renderServerNonPreviewableAttachment(attachment, index) {
      const formattedFileName = attachmentsHelpers.getFormattedFileName(attachment.fileName);
      const {text} = this.props;
      const clickHandler = this._onAttachmentClick.bind(this, attachment.url);
      const attachmentAriaLabel = text.ariaLabelOpenFile.replace(
        "{{file_name}}",
        formattedFileName
      );

      return (
        <div
          key={index}
          className="hs-attachment"
          onClick={clickHandler}
          aria-label={attachmentAriaLabel}
          role="button">
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
     * Render server previewable attachment message
     * @param {Object} attachment - attachment to be rendered
     * @param {string} attachment.fileName - attachment name
     * @param {string} attachment.url - attachment url
     * @param {Number} index - attachment index
     */
    _renderServerPreviewableAttachment(attachment, index) {
      const {url} = attachment;
      const clickHandler = this._onAttachmentClick.bind(this, url);
      const wrapperStyles = {
        backgroundImage: `url(${url})`,
        height: `${this.state.imageWrapperHeight}px`
      };

      return (
        <div
          style={wrapperStyles}
          key={index}
          className="hs-message__image-wrapper"
          onClick={clickHandler}
        />
      );
    },

    /**
     * Render FAQ suggestions message.
     */
    _renderFaqMessage() {
      const {body, suggestedFaqs} = this.props.message;

      if (!suggestedFaqs.length) {
        return null;
      }

      return (
        <div>
          <div className="hs-message__item">{body}</div>
          <div className="hs-message__suggested-faqs">{this._renderFaqs()}</div>
        </div>
      );
    },

    /**
     * Render an faq, which is a part of the faq message.
     */
    _renderFaqs() {
      const {
        onSuggestedFaqClick,
        message: {suggestedFaqs}
      } = this.props;

      return suggestedFaqs.map((faq) => {
        const {id, language} = faq;
        return (
          <a
            key={faq.id}
            className="hs-message__suggested-faq"
            dir="auto"
            onClick={onSuggestedFaqClick.bind(this, id, language)}
            tabIndex="0"
            aria-label={faq.title}
            role="button">
            {faq.title}
            <i className="ion-chevron-right hs-message__suggested-faq-icon" />
          </a>
        );
      });
    },

    /**
     * Render csat request message.
     */
    _renderCsatMessage() {
      return <div className="hs-message__item">{this.props.text.csatBotRequestMsg}</div>;
    },

    /**
     * Render user attachment message
     */
    _renderUserAttachmentMessage() {
      const {
        message: {isSystemMsg, states: messageStates, file, attachments}
      } = this.props;

      let attachmentEl = null;
      let attachmentIsPreviewable = false;

      // Attachment message is a frontend/dummy message
      if (isSystemMsg) {
        this._attachmentRenderConfig.name = file.name;
        attachmentIsPreviewable = this._isAttachmentPreviewable();

        // If attachment message is uploading, set loading icons
        if (messageStates.uploadInProgress) {
          this._attachmentRenderConfig.iconClasses = classes("ion-load-b", "ion--spinning");
        } else if (messageStates.error) {
          // If attachment message has errors, set icon classes depending on
          // error code. Also attach retry click handler in case of failure is
          // retryable.
          const errorCode = messageStates.errorCode;
          const failureIsRetryable = errorCode === FILE_UPLOAD_ERRORS.RETRY;

          if (failureIsRetryable) {
            this._attachmentRenderConfig.onClick = this._onRetryClick;
          } else {
            this._attachmentRenderConfig.onClick = null;
          }

          this._attachmentRenderConfig.iconClasses = classes("hs-message__icon-error", {
            "ion-alert-circled": !failureIsRetryable,
            "ion-reset": failureIsRetryable
          });
        } else {
          this._attachmentRenderConfig.iconClasses = "";
        }
      } else {
        // Attachment message is a backend message
        const attachment = attachments[0];

        this._attachmentRenderConfig.name = attachment.fileName;
        this._attachmentRenderConfig.url = attachment.url;
        this._attachmentRenderConfig.iconClasses = "ion-attachment";

        attachmentIsPreviewable = this._isAttachmentPreviewable();
      }

      if (attachmentIsPreviewable) {
        attachmentEl = this._renderPreviewableAttachment();
      } else {
        attachmentEl = this._renderNonPreviewableAttachment();
      }

      return <div className="hs-message__item hs-message__attachment">{attachmentEl}</div>;
    },

    /**
     * Render previewable attachment
     */
    _renderPreviewableAttachment() {
      // @TODO :- Get alt text from designers
      // Render uploaded image
      if (this._attachmentRenderConfig.url) {
        return this._renderUploadedImage();
      }
      // Render local image
      return this._renderLocalImage();
    },

    /**
     * Render uploaded image
     */
    _renderUploadedImage() {
      const {url} = this._attachmentRenderConfig;

      const clickHandler = this._onAttachmentClick.bind(this, url);
      const wrapperStyles = {
        backgroundImage: `url(${url})`,
        height: `${this.state.imageWrapperHeight}px`
      };
      let imageEl = null;

      if (!this.state.imageLoaded) {
        imageEl = (
          <img className="hs-message__height-finder" src={url} onLoad={this._onImageLoad} />
        );
      }

      return (
        <div style={wrapperStyles} className="hs-message__image-wrapper" onClick={clickHandler}>
          {imageEl}
        </div>
      );
    },

    /**
     * Render local image
     */
    _renderLocalImage() {
      const {onClick} = this._attachmentRenderConfig;

      const bgImg = this.state.localImageData ? `url(${this.state.localImageData})` : "none";
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

        imageEl = <img {...imageProps} />;
      }

      const wrapperStyles = {
        backgroundImage: bgImg,
        height: `${this.state.imageWrapperHeight}px`
      };

      return (
        <div onClick={onClick}>
          <div
            ref={this._saveLocalImageWrapperRef}
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
    _renderNonPreviewableAttachment() {
      const {name, iconClasses, onClick, url} = this._attachmentRenderConfig;
      const {ariaLabelOpenFile} = this.props.text;
      const formatedFileName = attachmentsHelpers.getFormattedFileName(name);
      let wrapperClickHandler;

      if (!this.props.message.isSystemMsg) {
        wrapperClickHandler = this._onAttachmentClick.bind(this, url);
      } else {
        wrapperClickHandler = onClick;
      }

      const attachmentAriaLabel = ariaLabelOpenFile.replace("{{file_name}}", formatedFileName);

      return (
        <div
          className="hs-message__user-attachment"
          onClick={wrapperClickHandler}
          aria-label={attachmentAriaLabel}
          role="button">
          <i className={iconClasses} />
          <span title={name}>{attachmentsHelpers.getFormattedFileName(name)}</span>
        </div>
      );
    },

    /**
     * Render separator message.
     */
    _renderChatSeparator() {
      const {hr, timestamp, infoText} = this.props.message;
      const {text} = this.props;
      let hrEl, timestampEl, infoTextEl;

      if (hr) {
        // horizontal line separating conversations
        hrEl = <div className="hs-message__hr" aria-label={text.conversationClosed} />;
      }

      if (timestamp) {
        timestampEl = <div className="hs-message hs-message--timestamp">{timestamp}</div>;
      }

      if (infoText) {
        infoTextEl = <div className="hs-message hs-message--info-text">{infoText}</div>;
      }

      return (
        <div>
          {infoTextEl}
          {hrEl}
          {timestampEl}
        </div>
      );
    },

    /**
     * Render attachment errors
     */
    _renderAttachmentErrors() {
      const {message} = this.props;

      let attachmentsErrorEl = null;

      if (message.type === MESSAGE_TYPE.ATTACHMENT && message.isSystemMsg && message.states.error) {
        const errorTextEl = this._getAttachmentErrorMessageEl(message.states.errorCode);

        attachmentsErrorEl = <div className="hs-message__attachment-error">{errorTextEl}</div>;
      }

      return attachmentsErrorEl;
    },

    /**
     * Render agent name and message timestamp.
     */
    _renderMessageDetails() {
      const agentName = this._getAgentNickname();
      const time = this._getHumanReadableTime();
      let details = time;

      if (agentName) {
        details = agentName + AGENT_NAME_SEPARATOR + time;
      }

      return (
        <div className="hs-message__details" aria-hidden>
          {details}
        </div>
      );
    },

    _onMsgClick(event) {
      const messageList = document.querySelector(".hs-message-list");
      const selector =
        ".hs-message-list " + commonHelper.getSelectorForElement(event.target, messageList);

      ax.setActiveIndex({
        selector: selector
      });
    },
    /**
     * Get agent nickname.
     */
    _getAgentNickname() {
      const {message, showAgentNickname} = this.props;

      if (!showAgentNickname || message.isCustomerMsg || message.isSystemMsg) {
        return null;
      }

      return objUtils.getIn(message, ["author", "name"]);
    },

    /**
     * Get human readable time
     */
    _getHumanReadableTime() {
      const {
        message: {type: messageType, states: messageStates, createdTs},
        text
      } = this.props;

      // If the message is of type attachment and it's uploading at the moment,
      // show `Uploading..` and return.
      if (
        messageType === MESSAGE_TYPE.ATTACHMENT &&
        messageStates &&
        messageStates.uploadInProgress
      ) {
        return text.attachmentUploadingStatus;
      }

      return dateUtils.format(createdTs, "{hh}:{MM} {a}");
    },

    /**
     * Load handler for image tag
     */
    _onImageLoad(ev) {
      const imageHeight = ev.target.clientHeight;
      if (imageHeight < IMAGE_MSG_MAX_HEIGHT) {
        // Set height of parent div
        this.setState({
          imageWrapperHeight: imageHeight
        });
      }
      if (this.props.onImageLoad) {
        this.props.onImageLoad();
      }
      this.setState({
        imageLoaded: true
      });
    },

    /**
     * Click handler for attachment
     */
    _onAttachmentClick(url) {
      window.open(url);
    },

    /**
     * Returns error text depending on error code
     * @param {Number} errorCode - error code of failure
     * @returns {Element} - The attachment error message element
     */
    _getAttachmentErrorMessageEl(errorCode) {
      const {text} = this.props;
      const {iconClasses} = this._attachmentRenderConfig;
      let errorTextEl;

      switch (errorCode) {
        case FILE_UPLOAD_ERRORS.RETRY:
          errorTextEl = [<i className={iconClasses} />, <small>{text.attachmentRetryError}</small>];
          break;

        case FILE_UPLOAD_ERRORS.SIZE_EXCEEDED:
          errorTextEl = [
            <i className={iconClasses} />,
            <small>{text.attachmentFileSizeError}</small>
          ];
          break;

        case FILE_UPLOAD_ERRORS.INVALID_TYPE:
          errorTextEl = [
            <i className={iconClasses} />,
            <small>{text.attachmentFileTypeError}</small>
          ];
          break;

        default:
          errorTextEl = [
            <i className={iconClasses} />,
            <small>{text.attachmentDefaultError}</small>
          ];
          break;
      }

      return errorTextEl;
    },

    /**
     * Predicate to check if attachment is of type image
     * @param {String} name - attachment file name
     * @param {String} url - attachment url
     * @returns {Boolean} - attachment is of type image
     */
    _isImageAttachment(name, url) {
      let imageIdentifier;

      // If file does not contain any extension
      if (name.indexOf(".") !== -1) {
        imageIdentifier = name;
      } else if (url && url.indexOf(".") !== -1) {
        imageIdentifier = url;
      } else {
        return false;
      }

      const dotIndex = imageIdentifier.lastIndexOf(".") + 1;
      const fileExt = imageIdentifier.substr(dotIndex, imageIdentifier.length).toLowerCase();

      return IMAGE_EXTENSIONS.indexOf(fileExt) !== -1;
    },

    /**
     * Predicate to check if attachment is previewable
     * @returns {Boolean} - attachment is previewable
     */
    _isAttachmentPreviewable() {
      const {message} = this.props;

      if (message.type !== MESSAGE_TYPE.ATTACHMENT) {
        return false;
      }

      const name = this._getFileName();
      const isImageAttachment = this._isImageAttachment(name, this._attachmentRenderConfig.url);
      const localAttachmentHasError = message.isSystemMsg ? message.states.error : true;

      // For any attachment to be previewable
      // a] The type of attachment must be of type image and
      // b] If it is local image, it should have error
      //    Do not show preview while uploading!
      return isImageAttachment && localAttachmentHasError;
    },

    /**
     * Returns file name by checking attachment config name
     * If attachment config name is not present return name by using message object
     */
    _getFileName() {
      const {message} = this.props;
      let name = this._attachmentRenderConfig.name;

      if (!name) {
        name = message.file ? message.file.name : message.attachments[0].fileName;
      }

      return name;
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
    _saveLocalImageWrapperRef(ref) {
      this._localImgWrapperRef = ref;
    },

    /**
     * Save local image reference
     * @param {Object} ref - DOM reference of image
     */
    _saveLocalImageRef(ref) {
      this._localImgRef = ref;
    },

    /**
     * Flag to represent local image is picked up by file reader
     */
    _fileRead: false,

    /**
     * Preview attachment
     */
    _previewAttachment() {
      const {message} = this.props;
      if (!this._localImgWrapperRef || !message.isSystemMsg || this._fileRead) {
        return;
      }

      this._fileRead = true;

      const file = message.file;
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (ev) => {
        // @TODO :- check if image ref has already set src
        this.setState({
          localImageData: ev.target.result
        });
      };
    },

    /**
     * Click handler for retry attachment
     */
    _onRetryClick() {
      const {message} = this.props;
      this.props.onRetryAttachmentClick(message);
    },

    componentDidUpdate() {
      this._previewAttachment();

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
});
