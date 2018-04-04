/**
 * Chat View footer Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 17, 2017
 */

define ("components/chatViewFooter",
  [
    "components/starRating",
    "components/containers/replyBox",
    "components/commons/fileInput",
    "constants/chatView",
    "constants/keyCodes",
    "constants/propTypes",
    "gunpowder/utils/classes"
  ],
  function (StarRating, ReplyBoxContainer, FileInput, CHAT_VIEW_CONSTANTS, KEY_CODES,
    customPropTypes, classes) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {
      ACTIVE_FOOTER,
      USER_INPUT_TYPES,
      HTML_INPUT_TYPES
    } = CHAT_VIEW_CONSTANTS;
    const {OPTION_PROP_TYPE} = customPropTypes;

    return React.createClass ({
      displayName: "ChatViewFooter",
      propTypes: {
        activeFooter: PropTypes.string.isRequired,
        rating: PropTypes.number,
        browserIsMobile: PropTypes.bool,
        allowFullScreen: PropTypes.bool,
        onSubmitReply: PropTypes.func.isRequired,
        onValueChangeInputField: PropTypes.func.isRequired,
        onAcceptResolutionQuestionClick: PropTypes.func.isRequired,
        onRejectResolutionQuestionClick: PropTypes.func.isRequired,
        onStartNewConversation: PropTypes.func.isRequired,
        onStarClick: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          resolutionQuestionAccept: PropTypes.string.isRequired,
          resolutionQuestionReject: PropTypes.string.isRequired,
          closeConversationBtn: PropTypes.string.isRequired,
          csatBotRequestMsg: PropTypes.string.isRequired,
          chatViewConversationResolutionQuestion: PropTypes.string.isRequired,
          chatViewIssueRejectionQuestion: PropTypes.string.isRequired,
          chatViewStartNewConversation: PropTypes.string.isRequired
        }).isRequired,
        footerIsActive: PropTypes.bool,
        onFooterFocus: PropTypes.func,
        onFooterBlur: PropTypes.func,
        userInput: PropTypes.shape ({
          type: PropTypes.string.isRequired,
          value: PropTypes.string,
          options: PropTypes.arrayOf (OPTION_PROP_TYPE),
          disabled: PropTypes.bool,
          label: PropTypes.string,
          required: PropTypes.bool,
          skipLabel: PropTypes.string,
          placeholder: PropTypes.string,
          errorMsg: PropTypes.string
        }),
        onPillOptionSelect: PropTypes.func,
        onSkipUserInput: PropTypes.func,
        onFilesChange: PropTypes.func,
        issueIsCreated: PropTypes.bool,
        fullPrivacyEnabled: PropTypes.bool
      },

      render () {
        const {
          footerIsActive,
          browserIsMobile,
          allowFullScreen,
          userInput: {
            skipLabel
          }
        } = this.props;

        const footerClasses = classes ("hs-footer", {
          "hs-footer--active" : footerIsActive,
          "hs-footer--mobile": browserIsMobile,
          "hs-footer--full-screen": allowFullScreen
        });

        let skipBtnEl = null;

        // @TODO - Add styles once UI is rendered
        // a. Create a new BEM block for footer wrapper (column layout)
        // b. Footer wrapper will contain two items
        //    1. 'skip' button (optional)
        //    2. footer component (reply box || pill select || user input)
        if (skipLabel) {
          skipBtnEl = (
            <button className="hs-footer-wrapper__skip-btn"
                    onClick={this._onSkipUserInputClick}>
              {skipLabel}
            </button>
          );
        }

        return (
          <div className="hs-footer-wrapper">
            {skipBtnEl}
            <div className={footerClasses}>
              {this._renderFooterComponent ()}
            </div>
          </div>
        );
      },

      /**
       * Render the active footer component
       */
      _renderFooterComponent () {
        const {
          userInput: {
            type
          },
          activeFooter
        } = this.props;

        switch (activeFooter) {
          case ACTIVE_FOOTER.REPLY:
            if (type === USER_INPUT_TYPES.PILL_SELECT) {
              return this._renderPillOptionsFooter ();
            }
            return this._renderUserInput ();

          case ACTIVE_FOOTER.SOLUTION_REJECTED:
            return this._renderReplyBox ();

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
            <ReplyBoxContainer className="hs-chat-footer__text-area" />
          </div>
        );
      },

      /**
       * Render user input
       * User input layout renders following things
       *  a. Label
       *  b. Input component (input [type = text or email] | replyBox)
       *  c. Error
       */
      _renderUserInput () {
        const {
          userInput: {
            value,
            type,
            placeholder,
            errorMsg,
            disabled
          },
          onFooterFocus,
          onFooterBlur
        } = this.props;
        const footerClasses = classes (
          "hs-chat-footer", {
            "hs-chat-footer--form-error": errorMsg,
            "hs-chat-footer--form-invalid": disabled || !value.trim ()
          }
        );
        let errorMsgEl = null;
        let inputComponentEl = null;

        // We need to render reply box for input component for input type plain text
        // and default input (when user is on issue state) as
        // a. User can enter long (multi line) text. (reply box supports multi line text)
        // b. Rendering normal input type 'text' will clip the text once it goes
        //    beyond available width
        // c. There can be label for input type plain text (this layout supports label)
        if (type === USER_INPUT_TYPES.PLAIN_TEXT || type === USER_INPUT_TYPES.DEFAULT_INPUT) {
          inputComponentEl = (
            <ReplyBoxContainer className="hs-chat-footer__text-area" />
          );
        } else {
          inputComponentEl = (
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
          );
        }

        if (errorMsg) {
          errorMsgEl = (
            <div className="hs-chat-footer__field">
              <div className="hs-chat-footer__title">
               {errorMsg}
              </div>
            </div>
          );
        }

        return (
          <div className={footerClasses}>
            {this._renderFooterLabelComponent ()}
            <div className="hs-chat-footer__field">
              {inputComponentEl}
              {this._renderFooterAction ()}
            </div>
            {errorMsgEl}
          </div>
        );
      },

      /**
       * Render reply box action
       */
      _renderFooterAction () {
        if (this.props.userInput.value || !this.props.issueIsCreated ||
            this.props.fullPrivacyEnabled) {
          return this._renderSendButton ();
        }
        return this._renderAttachmentButton ();
      },

      /**
       * Render send button
       */
      _renderSendButton () {
        return (
          <a className="hs-chat-footer__submit" onClick={this.props.onSubmitReply}>
            <i className="ion-send" />
          </a>
        );
      },

      /**
       * Render attachment button
       */
      _renderAttachmentButton () {
        return (
          <FileInput onChange={this.props.onFilesChange}
                     noPadding
                     labelClasses="hs-chat-footer__attachment-icon"
                     iconClasses="ion-attachment" />
        );
      },

      /**
       * Render pill options footer
       */
      _renderPillOptionsFooter () {
        const {
          userInput: {
            options
          }
        } = this.props;
        const btnClasses = classes (
          "hs-button",
          "hs-button--hollow",
          "hs-chat-footer__button"
        );
        const pillOptionsEl = options.map ((option) => {
          return (
            <button onClick={this._onPillOptionClick.bind (this, option)}
                    className={btnClasses}>
              {option.label}
            </button>
          );
        });

        // @TODO - Add styles once UI is rendered
        return (
          <div className="chat-view-footer">
            <div className="hs-chat-footer__pill-options">
              {pillOptionsEl}
            </div>
          </div>
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
        const {
          text,
          onAcceptResolutionQuestionClick,
          onRejectResolutionQuestionClick
        } = this.props;
        const btnClasses = classes (
          "hs-button",
          "hs-button--hollow",
          "hs-chat-footer__button"
        );

        return (
          <div className="hs-chat-footer">
            <div className="hs-chat-footer__heading" >
              <strong>{text.chatViewConversationResolutionQuestion}</strong>
            </div>
            <div className="hs-chat-footer__buttons-wrapper">
              <button className={btnClasses}
                      onClick={onRejectResolutionQuestionClick}>
                {text.resolutionQuestionReject}
              </button>
              <button className={btnClasses}
                      onClick={onAcceptResolutionQuestionClick}>
                {text.resolutionQuestionAccept}
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
       * Render footer label component
       */
      _renderFooterLabelComponent () {
        const {
          userInput: {
            label
          },
          activeFooter,
          text: {
            chatViewIssueRejectionQuestion
          }
        } = this.props;
        let headingEl = null;
        let labelEl = null;

        if (label) {
          labelEl = (
            <div className="hs-chat-footer__field">
              <div className="hs-chat-footer__title">
               {label}
              </div>
            </div>
          );
        }

        // Heading for user input is a rare case, currently its only used for
        // displaying question when resolution is rejected by the user.
        if (activeFooter === ACTIVE_FOOTER.SOLUTION_REJECTED) {
          headingEl = (
            <strong className="hs-chat-footer__heading hs-chat-footer__reply-heading">
              {chatViewIssueRejectionQuestion}
            </strong>
          );
        }

        return [headingEl, labelEl];
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
          this.props.onSubmitReply ();
        }
      },

      /**
       * Click handler for pill options (buttons)
       * @param {String} option - selected option
       */
      _onPillOptionClick (option) {
        this.props.onPillOptionSelect (option);
      },

      /**
       * Click handler for skip input button
       */
      _onSkipUserInputClick () {
        this.props.onSkipUserInput ();
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