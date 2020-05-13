/**
 * Message Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define("components/message", [
  "components/attachment",
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
  attachmentComponents,
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

  const {Fragment} = React;

  const {UserAttachmentMessage, ServerAttachmentsMessage} = attachmentComponents;
  const {TYPE: MESSAGE_TYPE, MESSAGE_ROLES} = MESSAGE_CONSTANTS;
  const {FILE_UPLOAD_ERRORS} = ERROR_CONSTANTS;
  const IMAGE_MSG_MAX_HEIGHT = 170;
  const AGENT_NAME_SEPARATOR = ", ";

  return createReactClass({
    displayName: "Message",
    propTypes: {
      message: customPropTypes.MESSAGE_PROP_TYPE,
      showAgentNickname: PropTypes.bool,
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
        ariaLabelOpenFile: PropTypes.string,
        systemNickname: PropTypes.string
      }).isRequired,
      /**
       * If true, render avatar in message feed
       */
      showAvatar: PropTypes.bool.isRequired,
      avatarUrl: PropTypes.string,
      /**
       * If true, show message details (timestamp, nickname) & avatar
       */
      showMessageDetails: PropTypes.bool,
      /**
       * Unique key of a message
       */
      key: PropTypes.string
    },

    getDefaultProps() {
      return {
        showAgentNickname: false
      };
    },

    getInitialState() {
      return {
        imageWrapperHeight: IMAGE_MSG_MAX_HEIGHT
      };
    },

    render() {
      const {isCustomerMsg, type, states, body} = this.props.message;
      const {key} = this.props;
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
        <div className={msgClasses} onClick={this._onMsgClick} aria-label={msgLabel} key={key}>
          {this._renderMessage()}
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
            {this._renderAvatar()}
            <div className="hs-message__details-and-msg-wrapper">
              {this._renderMessageDetails()}
              {messageItemEl}
              {this._renderAttachmentErrors()}
            </div>
          </div>
        );
      }

      return null;
    },

    _renderAvatar() {
      const {avatarUrl} = this.props;

      if (!this._shouldAvatarRender()) {
        return null;
      }

      return <img src={avatarUrl} alt="Avatar Image" className="hs-message__avatar" aria-hidden />;
    },

    /**
     * Render server text and attachment(bots & agent) message
     */
    _renderServerMessage() {
      let textMessageEl = null;

      const {
        message: {redacted, body},
        text: {messageDeleted}
      } = this.props;

      if (redacted) {
        // Redaction message is a plain text and needs
        // to be shown in italics.
        textMessageEl = (
          <em key="redacted-message" className="hs-message__item hs-message--redacted" dir="auto">
            {messageDeleted}
          </em>
        );
      } else if (body) {
        /* eslint-disable react/no-danger */
        textMessageEl = (
          <div
            key="text-message"
            className="hs-message__item"
            dir="auto"
            dangerouslySetInnerHTML={{__html: body}}
          />
        );
        /* eslint-enable react/no-danger */
      }

      return (
        <Fragment>
          {textMessageEl}
          {this._renderServerAttachments()}
        </Fragment>
      );
    },

    /**
     * Render agent or bot message attachments
     */
    _renderServerAttachments() {
      const {attachments} = this.props.message;
      const {ariaLabelOpenFile} = this.props.text;

      return (
        <ServerAttachmentsMessage attachments={attachments} ariaLabelOpenFile={ariaLabelOpenFile} />
      );
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
        message: {suggestedFaqs, id: msgId, faqSource}
      } = this.props;

      return suggestedFaqs.map((faq) => {
        const {id, language} = faq;
        return (
          <a
            key={faq.id}
            className="hs-message__suggested-faq"
            dir="auto"
            onClick={onSuggestedFaqClick.bind(this, id, language, msgId, faqSource)}
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
        message: {isSystemMsg: messageIsClientGenerated, states: messageStates, file, attachments},
        text: {ariaLabelOpenFile},
        onImageLoad
      } = this.props;

      return (
        <UserAttachmentMessage
          messageIsClientGenerated={messageIsClientGenerated}
          messageStates={messageStates}
          file={file}
          attachments={attachments}
          ariaLabelOpenFile={ariaLabelOpenFile}
          onImageLoad={onImageLoad}
          onRetryClick={this._onRetryClick}
        />
      );
    },

    /**
     * Render separator message.
     */
    _renderChatSeparator() {
      const {hr, timestamp, infoText} = this.props.message;
      const {text, showAvatar} = this.props;
      const chatSeparatorWrapperClasses = classes({
        "hs-message__chat-separator-wrapper": showAvatar
      });
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
        <div className={chatSeparatorWrapperClasses}>
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
      if (!this.props.showMessageDetails) {
        return null;
      }

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
     * If message is system message return system nickname
     */
    _getAgentNickname() {
      const {message, showAgentNickname, text} = this.props;

      if (!showAgentNickname || message.isCustomerMsg) {
        return null;
      } else if (this._isSystemMessage(message)) {
        return text.systemNickname;
      }

      return objUtils.getIn(message, ["author", "name"]);
    },

    /**
     * Returns true if message is system message
     * @param {Object} message - message object
     * @returns {boolean} - True, if message is system message
     */
    _isSystemMessage(message) {
      return message.author && message.author.role === MESSAGE_ROLES.SYSTEM_MSG;
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
      const failureIsRetriable = errorCode === FILE_UPLOAD_ERRORS.RETRY;

      const iconClasses = classes("hs-message__icon-error", {
        "ion-alert-circled": !failureIsRetriable,
        "ion-reset": failureIsRetriable
      });

      let errorTextEl;

      switch (errorCode) {
        case FILE_UPLOAD_ERRORS.RETRY:
          errorTextEl = [
            <i className={iconClasses} key="retry-icon" />,
            <small key="retry-text">{text.attachmentRetryError}</small>
          ];
          break;

        case FILE_UPLOAD_ERRORS.SIZE_EXCEEDED:
          errorTextEl = [
            <i className={iconClasses} key="retry-icon" />,
            <small key="retry-text">{text.attachmentFileSizeError}</small>
          ];
          break;

        case FILE_UPLOAD_ERRORS.INVALID_TYPE:
          errorTextEl = [
            <i className={iconClasses} key="retry-icon" />,
            <small key="retry-text">{text.attachmentFileTypeError}</small>
          ];
          break;

        default:
          errorTextEl = [
            <i className={iconClasses} key="retry-icon" />,
            <small key="retry-text">{text.attachmentDefaultError}</small>
          ];
          break;
      }

      return errorTextEl;
    },

    /**
     * Predicate to check if attachment is previewable
     * @returns {Boolean} - attachment is previewable
     */
    _isAttachmentPreviewable() {
      const {isSystemMsg, attachments, type, states: messageStates} = this.props.message;
      let contentType = null;

      if (type !== MESSAGE_TYPE.ATTACHMENT) {
        return false;
      }

      if (!isSystemMsg) {
        const attachment = attachments[0];
        contentType = attachment.contentType;
      }

      const isImageAttachment = attachmentsHelpers.isImageAttachment(contentType);
      const localAttachmentHasError = isSystemMsg ? messageStates.error : true;

      // For any attachment to be previewable
      // a] The type of attachment must be of type image and
      // b] If it is local image, it should have error
      //    Do not show preview while uploading!
      return isImageAttachment && localAttachmentHasError;
    },

    /**
     * Returns file name by using the message object
     */
    _getFileName() {
      const {message} = this.props;

      return message.file ? message.file.name : message.attachments[0].fileName;
    },

    /**
     * Click handler for retry attachment
     */
    _onRetryClick() {
      const {message} = this.props;
      this.props.onRetryAttachmentClick(message);
    },

    /**
     * Check whether avatar should be rendered
     * @returns {Boolean} - True, if the avatar should be rendered
     */
    _shouldAvatarRender() {
      const {
        showAvatar,
        message: {isCustomerMsg},
        showMessageDetails
      } = this.props;

      return showAvatar && !isCustomerMsg && showMessageDetails;
    }
  });
});
