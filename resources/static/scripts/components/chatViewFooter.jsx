/**
 * Chat View footer Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 17, 2017
 */

define ("components/chatViewFooter",
  [
    "components/starRating",
    "components/containers/replyBox",
    "constants/chatView",
    "constants/propTypes",
    "constants/keyCodes",
    "gunpowder/utils/classes"
  ],
  function (StarRating, ReplyBoxContainer, CHAT_VIEW_CONSTANTS, PROP_TYPES,
    KEY_CODES, classes) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {ACTIVE_FOOTER} = CHAT_VIEW_CONSTANTS;
    const {INFO_BOT_FIELD_PROPS} = PROP_TYPES;

    return React.createClass ({
      displayName: "ChatViewFooter",
      propTypes: {
        activeFooter: PropTypes.string.isRequired,
        rating: PropTypes.number,
        browserIsMobile: PropTypes.bool,
        allowFullScreen: PropTypes.bool,
        onFaqSuggestionFeedback: PropTypes.func.isRequired,
        infoBotField: INFO_BOT_FIELD_PROPS,
        onSubmitInfoBotField: PropTypes.func.isRequired,
        onValueChangeInfoBotField: PropTypes.func.isRequired,
        onAcceptResolutionQuestionClick: PropTypes.func.isRequired,
        onRejectResolutionQuestionClick: PropTypes.func.isRequired,
        onStartNewConversation: PropTypes.func.isRequired,
        onStarClick: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          labelYes: PropTypes.string.isRequired,
          labelNo: PropTypes.string.isRequired,
          closeConversationBtn: PropTypes.string.isRequired,
          csatBotRequestMsg: PropTypes.string.isRequired,
          chatViewConversationResolutionQuestion: PropTypes.string.isRequired,
          chatViewStartNewConversation: PropTypes.string.isRequired
        }).isRequired,
        footerIsActive: PropTypes.bool,
        onFooterFocus: PropTypes.func,
        onFooterBlur: PropTypes.func
      },

      render () {
        const {
          footerIsActive,
          browserIsMobile,
          allowFullScreen
        } = this.props;

        const footerClasses = classes ("hs-footer", {
          "hs-footer--active" : footerIsActive,
          "hs-footer--mobile": browserIsMobile,
          "hs-footer--full-screen": allowFullScreen
        });

        return (
          <div className={footerClasses}>
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

          case ACTIVE_FOOTER.CSAT:
            return this._renderCsatFooter ();

          case ACTIVE_FOOTER.CONVERSATION_RESOLUTION_QUESTION:
            return this._renderConversationResolutionFooter ();

          case ACTIVE_FOOTER.START_NEW_CONVERSATION:
            return this._renderStartNewConversationFooter ();

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
       * Render csat footer
       */
      _renderCsatFooter () {
        return (
          <div className="hs-chat-footer">
            <div className="hs-chat-footer__heading" >
              <strong className="hs-chat-footer__heading-text" >
                {this.props.text.csatBotRequestMsg}
              </strong>
            </div>
            <div className="hs-chat-footer__csat-footer">
              <StarRating name="csat"
                          value={this.props.rating}
                          onStarClick={this.props.onStarClick} />
            </div>
          </div>
        );
      },

      /**
       * Render conversation resolution footer
       */
      _renderConversationResolutionFooter () {
        const btnClasses = classes (
          "hs-button",
          "hs-button--hollow",
          "hs-chat-footer__button"
        );

        return (
          <div className="hs-chat-footer">
            <div className="hs-chat-footer__heading" >
              <strong>{this.props.text.chatViewConversationResolutionQuestion}</strong>
            </div>
            <div className="hs-chat-footer__buttons-wrapper">
              <button className={btnClasses}
                      onClick={this.props.onRejectResolutionQuestionClick}>
                {this.props.text.labelNo}
              </button>
              <button className={btnClasses}
                      onClick={this.props.onAcceptResolutionQuestionClick}>
                {this.props.text.labelYes}
              </button>
            </div>
          </div>
        );
      },

      /**
       * Render start new conversation footer
       */
      _renderStartNewConversationFooter () {
        const btnClasses = classes (
          "hs-button",
          "hs-button--hollow",
          "hs-chat-footer__button"
        );

        return (
          <div className="hs-chat-footer">
            <div className="hs-chat-footer__buttons-wrapper">
              <button className={btnClasses} onClick={this.props.onStartNewConversation}>
                {this.props.text.chatViewStartNewConversation}
              </button>
            </div>
          </div>
        );
      },

      /**
       * Render info bot footer.
       */
      _renderInfoBotFooter () {
        const {
          infoBotField: field,
          onFooterFocus,
          onFooterBlur
        } = this.props;
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
                     onFocus={onFooterFocus}
                     onBlur={onFooterBlur}
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
        const {labelYes, labelNo} = this.props.text;

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
                {labelNo}
              </button>
              <button onClick={this._onFaqSuggestionsFeedbackClick.bind (this, false)}
                      className={btnClasses}>
                {labelYes}
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
  }
);