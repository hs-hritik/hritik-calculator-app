/**
 * Message Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/message",
  [
    "constants/propTypes",
    "constants/message",
    "constants/icons",
    "gunpowder/utils/date",
    "gunpowder/utils/classes",
    "gunpowder/utils/object"
  ],
  function (PROP_TYPES, MESSAGE_CONSTANTS, ICONS_CONSTANTS, dateUtils, classes,
            objUtils) {
    "use strict";

    const MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE;
    // Total character limit is 22
    // 22 = X (name limit) + 3 (ELLIPSIS_LENGTH) + Y (extension)
    const MAX_CHAR_LIMIT = 22;
    const MAX_EXTENSION_LIMIT = 5;
    const ELLIPSIS_LENGTH = 3;

    const {FILE_ICON} = ICONS_CONSTANTS;

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
        text: PropTypes.shape ({
          faqSuggestionsMsgTitleSingle: PropTypes.string.isRequired,
          faqSuggestionsMsgTitleMultpile: PropTypes.string.isRequired,
          csatBotRequestMsg: PropTypes.string.isRequired,
          csatLinkCaption: PropTypes.string.isRequired
        }).isRequired
      },

      getDefaultProps () {
        return {
          showAgentNickname: false,
          isLastMessage: false
        };
      },

      render () {
        if (this.props.message.type === MESSAGE_TYPE.END_CHAT) {
          return this._renderEndChatMessage ();
        }

        const {isCustomerMsg} = this.props.message;
        const msgClasses = classes (
          "hs-message", {
            "hs-message--left": !isCustomerMsg,
            "hs-message--right": isCustomerMsg
          }
        );

        return (
          <div className={msgClasses}>
            {this._renderMessage ()}
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
          <div className="hs-message__item">
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
      _renderAttachment (attachment) {
        // @TODO :- Display extension on file icon
        const formattedFileName = this._formatFileName (attachment.fileName);
        const clickHandler = this._onAttachmentClick.bind (this, attachment.url);

        /* eslint-disable react/no-danger */
        return (
          <div className="hs-attachment" onClick={clickHandler}>
            <i className="hs-attachment__file-icon"
               dangerouslySetInnerHTML={{__html: FILE_ICON}} />
            <div className="hs-attachment__text-wrapper">
              <small className="hs-attachment__text" title={attachment.fileName}>
                {formattedFileName}
              </small>
              <a target="_blank"
                 className="hs-attachment__download-icon-wrapper"
                 href={attachment.url} >
                <i className="hs-attachment__download-icon ion-eye" />
                <small className="hs-attachment__text">View</small>
              </a>
            </div>
          </div>
        );
        /* eslint-enable react/no-danger */
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
       * Render end chat message.
       */
      _renderEndChatMessage () {
        // @TODO: Fix end chat msg css and show agent nickname if enabled
        return (
          <div className="hs-message hs-message--end-chat">
            Agent ended chat
          </div>
        );
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

        if (message.isCustomerMsg || message.isSystemMsg || !this.props.isLastMessageInGroup) {
          return null;
        }

        // If agent nickname is disabled, show "Agent"
        let agentNickname = "Agent";
        if (showAgentNickname) {
          agentNickname = objUtils.getIn (message, ["author", "nickname"]);
        }
        return agentNickname;
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

        // If the message came in the last one minute, show "Just now".
        if (timeAgoMs < 60000) {
          timeAgoStr = "Just now";
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
       * Return formatted file name
       * @NOTE :- Move to gunpowder if required at multiple places
       */
      _formatFileName (fileName) {
        if (fileName.length <= MAX_CHAR_LIMIT) {
          return fileName;
        }

        const fileNameArr = fileName.split (".");
        // If there are multiple dots in file name, then get the last extension
        // Example :- File name can be "hello.world.text";
        let extension = fileNameArr.length > 1 ?
                        fileNameArr [fileNameArr.length - 1] : "";

        // If extension length is greater that MAX_EXTENSION_LIMIT then
        // get last allowed characters of extension
        // Example :- a-large-patch-file-name.having.other.multiple.extensions
        const extensionLength = extension.length;
        if (extensionLength > MAX_EXTENSION_LIMIT) {
          extension = extension.slice (
            extensionLength - MAX_EXTENSION_LIMIT,
            extensionLength
          );
        }

        // Note :- We are using extension.length again as the extension can change
        const nameLimit = MAX_CHAR_LIMIT - ELLIPSIS_LENGTH - extension.length;
        const nameStr = fileName.slice (0, nameLimit);

        return `${nameStr}...${extension}`;
      }
    });
  }
);
