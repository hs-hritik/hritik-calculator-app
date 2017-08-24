/**
 * Message Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/message",
  [
    "constants/propTypes",
    "constants/message",
    "gunpowder/utils/date",
    "gunpowder/utils/classes",
    "gunpowder/utils/object"
  ],
  function (PROP_TYPES, MESSAGE_CONSTANTS, dateUtils, classes, objUtils) {
    "use strict";

    const MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE;
    // Total character limit is 22
    // 22 = 15 (MAX_CHAR_LIMIT) + 3 (dots) + 4 (extension)
    const MAX_CHAR_LIMIT = 15;
    const EXTENSION_CHAR_LIMIT = 4;

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "Message",
      propTypes: {
        message: PropTypes.shape (PROP_TYPES.MESSAGE).isRequired,
        showAgentNickname: PropTypes.bool,
        isLastMessage: PropTypes.bool,
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
        // @TODO :- Replace file icon and download icon with SVG
        // @TODO :- Make complete attachment clickable
        // @TODO :- Display extension on file icon
        const formattedFileName = this._formatFileName (attachment.fileName);

        return (
          <div className="hs-attachment">
            <div className="hs-attachment__file-icon" />
            <div className="hs-attachment__name-wrapper">
              <div className="hs-attachment__name" title={attachment.fileName}>
                {formattedFileName}
              </div>
              <a target="_blank"
                 className="hs-attachment__download-icon-wrapper"
                 href={attachment.url} >
                <i className="ion-arrow-down hs-attachment__download-icon" />
                <span>View</span>
              </a>
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
        // Only render message details, if it's the last message,
        // and message type end chat msg
        if (!this.props.isLastMessage ||
            (this.props.message.type === MESSAGE_TYPE.END_CHAT)) {
          return null;
        }

        const {message, showAgentNickname} = this.props;
        let agentNickname = null;

        if (!(message.isCustomerMsg || message.isSystemMsg)) {
          // If agent nickname is disabled, or the agent hasn't set the nickname, show "Agent"
          agentNickname = "Agent";

          if (showAgentNickname) {
            // There won't be any author for system generated messages.
            agentNickname = objUtils.getIn (message, ["author", "nickname"]) || agentNickname;
          }
        }

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

        return (
          <div className="hs-message__details">
            <div className="hs-message__agent-nickname">
              {agentNickname}
            </div>
            <div className="hs-message__time-ago">
              {timeAgoStr}
            </div>
          </div>
        );
      },

      /**
       * Return formatted file name
       * @NOTE :- Move to gunpowder if required at multiple places
       */
      _formatFileName (fileName) {
        const length = fileName.length;

        if (length <= MAX_CHAR_LIMIT) {
          return fileName;
        }

        const name = fileName.slice (0, MAX_CHAR_LIMIT);
        const extension = fileName.slice (length - EXTENSION_CHAR_LIMIT, length);

        return `${name}...${extension}`;
      }
    });
  }
);
