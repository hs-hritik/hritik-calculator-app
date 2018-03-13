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
    "constants/keyCodes",
    "gunpowder/utils/classes"
  ],
  function (StarRating, ReplyBoxContainer, CHAT_VIEW_CONSTANTS, KEY_CODES, classes) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {
      ACTIVE_FOOTER,
      INPUT_TYPES,
      HTML_INPUT_TYPES
    } = CHAT_VIEW_CONSTANTS;

    return React.createClass ({
      displayName: "ChatViewFooter",
      propTypes: {
        activeFooter: PropTypes.string.isRequired,
        rating: PropTypes.number,
        browserIsMobile: PropTypes.bool,
        allowFullScreen: PropTypes.bool,
        onFaqSuggestionFeedback: PropTypes.func.isRequired,
        onSubmitInputField: PropTypes.func.isRequired,
        onValueChangeInputField: PropTypes.func.isRequired,
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
        onFooterBlur: PropTypes.func,
        userInput: PropTypes.shape ({
          value: PropTypes.string.isRequired,
          disabled: PropTypes.bool,
          type: PropTypes.string.isRequired,
          label: PropTypes.string,
          required: PropTypes.bool,
          skipLabel: PropTypes.string,
          placeholder: PropTypes.string,
          errorMsg: PropTypes.string
        })
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
        const {type} = this.props.userInput;

        switch (this.props.activeFooter) {
          case ACTIVE_FOOTER.REPLY:
            if (type === INPUT_TYPES.DEFAULT_INPUT) {
              return this._renderReplyBox ();
            } else if (type === INPUT_TYPES.PILL_SELECT) {
              return this._renderPillOptionsFooter ();
            }
            return this._renderUserInput ();

          case ACTIVE_FOOTER.SOLUTION_REJECTED:
            return this._renderReplyBox ();

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
       * Render reply box component
       */
      _renderReplyBox () {
        const {
          disabled,
          value,
          errorMsg
        } = this.props.userInput;
        const footerClasses = classes (
          "hs-chat-footer", {
            "hs-chat-footer--form-error": errorMsg,
            "hs-chat-footer--form-invalid": disabled || !value.trim ()
          }
        );

        return (
          <div className={footerClasses}>
            <ReplyBoxContainer />
          </div>
        );
      },

      /**
       * Render user input
       */
      _renderUserInput () {
        const {
          userInput: {
            value,
            type,
            placeholder,
            errorMsg,
            label,
            disabled
          },
          onFooterFocus,
          onFooterBlur,
          onSubmitInputField
        } = this.props;
        const footerClasses = classes (
          "hs-chat-footer", {
            "hs-chat-footer--form-error": errorMsg,
            "hs-chat-footer--form-invalid": disabled || !value.trim ()
          }
        );
        const ionClasses = errorMsg ? "ion-alert-circled" : "ion-send";
        let errorMsgEl = null;
        let labelEl = null;

        if (errorMsg) {
          errorMsgEl = (
            <div className="hs-chat-footer__field">
              <div className="hs-chat-footer__title">
               {errorMsg}
              </div>
            </div>
          );
        }

        if (label) {
          labelEl = (
            <div className="hs-chat-footer__field">
              <div className="hs-chat-footer__title">
               {label}
              </div>
            </div>
          );
        }

        return (
          <div className={footerClasses}>
            {labelEl}
            <div className="hs-chat-footer__field">
              <input className="hs-chat-footer__text-field"
                     type={this._getHtmlInputType (type)}
                     dir="auto"
                     value={value}
                     placeholder={placeholder}
                     onChange={this._onInputFieldValueChange}
                     onKeyUp={this._onInputFieldKeyUp}
                     onFocus={onFooterFocus}
                     onBlur={onFooterBlur}
                     autoFocus />
              <a className="hs-chat-footer__submit">
                <i className={ionClasses} onClick={onSubmitInputField} />
              </a>
            </div>
            {errorMsgEl}
          </div>
        );
      },

      /**
       * Render pill options footer
       */
      _renderPillOptionsFooter () {
        // @TODO - Render pill options layout
        return (
          <div className="hs-chat-footer__pill-options" />
        );
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
       * Render FAQ suggestions feedback footer.
       */
      // @TODO - Change the rendering to show pill select
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
       * Change handler for input field.
       * @param {Object} event
       */
      _onInputFieldValueChange (ev) {
        this.props.onValueChangeInputField (ev.target.value);
      },

      /**
       * Key up handler for input field.
       * @param {Object} event
       */
      _onInputFieldKeyUp (ev) {
        if (ev.keyCode === KEY_CODES.ESCAPE) {
          ev.target.blur ();
        } else if (ev.keyCode === KEY_CODES.ENTER) {
          this.props.onSubmitInputField ();
        }
      },

      /**
       * Return html input type for given input footer
       * @param {String} type - type of input footer
       * @returns {String} - html input type
       */
      _getHtmlInputType (type) {
        return HTML_INPUT_TYPES [type] || HTML_INPUT_TYPES.PLAIN_TEXT;
      }
    });
  }
);