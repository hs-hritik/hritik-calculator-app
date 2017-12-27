/**
 * ChatView Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/chatView",
  [
    "components/messageList",
    "constants/propTypes",
    "constants/chatView",
    "constants/keyCodes",
    "gunpowder/utils/classes",
    "components/containers/replyBox",
    "components/commons/viewHeader",
    "components/commons/dndWrapper",
    "components/starRating"
  ],
  function (MessageList, PROP_TYPES, CHAT_VIEW_CONSTANTS, KEY_CODES,
    classes, ReplyBoxContainer, ViewHeader, DnDWrapper, StarRating) {
    "use strict";

    const PropTypes = React.PropTypes,
          {ACTIVE_FOOTER} = CHAT_VIEW_CONSTANTS;

    const INFO_BOT_FIELD_PROPS = PropTypes.shape ({
      title: PropTypes.string.isRequired,
      value: PropTypes.shape ({
        value: PropTypes.string.isRequired,
        errorMsg: PropTypes.string
      }).isRequired
    });

    const ChatViewFooter = React.createClass ({
      displayName: "ChatViewFooter",
      propTypes: {
        activeFooter: PropTypes.string.isRequired,
        rating: PropTypes.number,
        onFaqSuggestionFeedback: PropTypes.func.isRequired,
        onCloseConversation: PropTypes.func.isRequired,
        infoBotField: INFO_BOT_FIELD_PROPS,
        onSubmitInfoBotField: PropTypes.func.isRequired,
        onValueChangeInfoBotField: PropTypes.func.isRequired,
        onStarClick: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          faqSuggestionsAdditionalHelpRequiredBtn: PropTypes.string.isRequired,
          faqSuggestionsAdditionalHelpNotRequiredBtn: PropTypes.string.isRequired,
          closeConversationBtn: PropTypes.string.isRequired
        }).isRequired
      },

      render () {
        return (
          <div className="hs-footer">
            {this._renderFooterComponent ()}
          </div>
        );
      },

      /**
       * Render the active footer component
       */
      _renderFooterComponent () {
        switch (this.props.activeFooter) {
          case ACTIVE_FOOTER.REPLY:
            return <ReplyBoxContainer />;

          case ACTIVE_FOOTER.FAQ_SUGGESTIONS_FEEDBACK:
            return this._renderFaqSuggestionsFeedback ();

          case ACTIVE_FOOTER.INFO_BOT:
            return this._renderInfoBotFooter ();

          case ACTIVE_FOOTER.BLOCKED:
            return this._renderBlockedFooter ();

          case ACTIVE_FOOTER.CLOSED:
            return this._renderClosedConversationFooter ();

          case ACTIVE_FOOTER.CSAT:
            return this._renderCsatFooter ();

          default:
            return null;
        }
      },

      /**
       * Render blocked footer
       */
      _renderBlockedFooter () {
        return (
          <div className="hs-chat-footer" />
        );
      },

      /**
       * Render closed conversation footer.
       */
      _renderClosedConversationFooter () {
        const btnClasses = classes (
          "hs-button",
          "hs-chat-footer__button"
        );

        return (
          <div className="hs-chat-footer">
            <div className="hs-chat-footer__buttons-wrapper">
              <button onClick={this._onCloseConversationClick}
                      className={btnClasses}>
                {this.props.text.closeConversationBtn}
              </button>
            </div>
          </div>
        );
      },

      /**
       * Render csat footer
       */
      _renderCsatFooter () {
        return (
          <div className="hs-chat-footer__csat-footer">
            <StarRating name="csat"
                        value={this.props.rating}
                        onStarClick={this.props.onStarClick} />
          </div>
        );
      },

      /**
       * Render info bot footer.
       */
      _renderInfoBotFooter () {
        const field = this.props.infoBotField;
        const hasError = !!this.props.infoBotField.value.errorMsg;

        const footerClasses = classes (
          "hs-chat-footer", {
            "hs-chat-footer--form-error": field.value.errorMsg,
            "hs-chat-footer--form-invalid": !field.value.value.trim ()
          }
        );

        const ionClasses = classes ({
          "ion-alert-circled": hasError,
          "ion-send": !hasError
        });

        return (
          <div className={footerClasses}>
            <div className="hs-chat-footer__field">
              <div className="hs-chat-footer__title">
               {field.title}
              </div>
            </div>
            <div className="hs-chat-footer__field">
              <input className="hs-chat-footer__text-field"
                     type="text"
                     dir="auto"
                     value={field.value.value}
                     placeholder={field.placeholder}
                     onChange={this._onInfoBotFieldValueChange}
                     onKeyUp={this._onInfoBotFieldKeyUp}
                     autoFocus />
              <a className="hs-chat-footer__submit">
                <i className={ionClasses} onClick={this._onClickSubmitInfoBotField} />
              </a>
            </div>
          </div>
        );
      },

      /**
       * Render FAQ suggestions feedback footer.
       */
      _renderFaqSuggestionsFeedback () {
        const {faqSuggestionsAdditionalHelpRequiredBtn,
               faqSuggestionsAdditionalHelpNotRequiredBtn} = this.props.text;

        const btnClasses = classes (
          "hs-button",
          "hs-button--hollow",
          "hs-chat-footer__button"
        );

        // If user does not need additional help (clicking on no), pass true indicating that
        // faq suggestions were helpful.
        // If user needs additional help (clicking on yes), pass false indicating that
        // faq suggestions were not helpful.
        return (
          <div className="hs-chat-footer">
            <div className="hs-chat-footer__buttons-wrapper">
              <button onClick={this._onFaqSuggestionsFeedbackClick.bind (this, true)}
                      className={btnClasses}>
                {faqSuggestionsAdditionalHelpNotRequiredBtn}
              </button>
              <button onClick={this._onFaqSuggestionsFeedbackClick.bind (this, false)}
                      className={btnClasses}>
                {faqSuggestionsAdditionalHelpRequiredBtn}
              </button>
            </div>
          </div>
        );
      },

      /**
       * Click handler for faq suggestions feedback
       * @param {String} feedback - "yes" or "no"
       */
      _onFaqSuggestionsFeedbackClick (feedback) {
        this.props.onFaqSuggestionFeedback (feedback);
      },

      /**
       * Click handler for close button.
       */
      _onCloseConversationClick () {
        this.props.onCloseConversation ();
      },

      /**
       * Change handler for info bot field.
       * @param {Object} event
       */
      _onInfoBotFieldValueChange (ev) {
        this.props.onValueChangeInfoBotField (ev.target.value);
      },

      /**
       * Key up handler for info bot field.
       * @param {Object} event
       */
      _onInfoBotFieldKeyUp (ev) {
        if (ev.keyCode === KEY_CODES.ESCAPE) {
          ev.target.blur ();
        } else if (ev.keyCode === KEY_CODES.ENTER) {
          this.props.onSubmitInfoBotField ();
        }
      },

      /**
       * Click handler for submit info bot field.
       */
      _onClickSubmitInfoBotField () {
        this.props.onSubmitInfoBotField ();
      }
    });

    return React.createClass ({
      displayName: "ChatView",
      propTypes: {
        messages: PropTypes.arrayOf (PropTypes.shape (
          PROP_TYPES.MESSAGE
        )).isRequired,
        rating: PropTypes.number,
        onSuggestedFaqClick: PropTypes.func,
        onStartCsatSurveyClick: PropTypes.func,
        showAgentNickname: PropTypes.bool,
        isTyping: PropTypes.bool,
        activeFooter: PropTypes.string.isRequired,
        browserIsMobile: PropTypes.bool,
        onMinimizeConversation: PropTypes.func,
        onFaqSuggestionFeedback: PropTypes.func.isRequired,
        onCloseConversation: PropTypes.func.isRequired,
        infoBotField: INFO_BOT_FIELD_PROPS,
        onSubmitInfoBotField: PropTypes.func.isRequired,
        onValueChangeInfoBotField: PropTypes.func.isRequired,
        onFilesDrop: PropTypes.func.isRequired,
        onRetryAttachmentClick: PropTypes.func.isRequired,
        onStarClick: PropTypes.func.isRequired,
        issueIsCreated: PropTypes.bool.isRequired,
        text: PropTypes.shape ({
          chatViewHeader: PropTypes.string.isRequired,
          dndInfoText: PropTypes.string.isRequired
        }).isRequired
      },

      render () {
        const {
          browserIsMobile,
          onMinimizeConversation,
          text,
          issueIsCreated
        } = this.props;

        return (
          <div className="hs-view">
            <ViewHeader title={text.chatViewHeader}
                        showCloseBtn={browserIsMobile}
                        onCloseBtnClick={onMinimizeConversation} />
            <DnDWrapper onDrop={this._onFilesDrop}
                        dragInfoText={text.dndInfoText}
                        enabled={issueIsCreated} >
              <div className="hs-view__content">
                <MessageList messages={this.props.messages}
                             isTyping={this.props.isTyping}
                             showAgentNickname={this.props.showAgentNickname}
                             text={this.props.text}
                             onRetryAttachmentClick={this.props.onRetryAttachmentClick}
                             onStartCsatSurveyClick={this.props.onStartCsatSurveyClick}
                             onSuggestedFaqClick={this.props.onSuggestedFaqClick} />
              </div>
              <ChatViewFooter activeFooter={this.props.activeFooter}
                              rating={this.props.rating}
                              onStarClick={this.props.onStarClick}
                              onFaqSuggestionFeedback={this.props.onFaqSuggestionFeedback}
                              onCloseConversation={this.props.onCloseConversation}
                              infoBotField={this.props.infoBotField}
                              onSubmitInfoBotField={this.props.onSubmitInfoBotField}
                              onValueChangeInfoBotField={this.props.onValueChangeInfoBotField}
                              text={this.props.text} />
            </DnDWrapper>
          </div>
        );
      },

      /**
       * Handler for files dropped event
       * @param {Object} - files list array like object
       */
      _onFilesDrop (files) {
        this.props.onFilesDrop (files);
      }
    });
  }
);
