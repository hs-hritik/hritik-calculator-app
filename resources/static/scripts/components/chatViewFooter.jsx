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
    "components/commons/skipButtonWrapper",
    "constants/chatView",
    "constants/keyCodes",
    "constants/propTypes",
    "helpers/common",
    "gunpowder/utils/classes"
  ],
  function (StarRating, ReplyBoxContainer, FileInput, SkipButtonWrapper,
    CHAT_VIEW_CONSTANTS, KEY_CODES, customPropTypes, commonHelpers, classes) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {
      ACTIVE_FOOTER,
      USER_INPUT_TYPES,
      HTML_INPUT_TYPES
    } = CHAT_VIEW_CONSTANTS;
    const {
      USER_INPUT_PROP_TYPE
    } = customPropTypes;

    return React.createClass ({
      displayName: "ChatViewFooter",
      propTypes: {
        activeFooter: PropTypes.string.isRequired,
        rating: PropTypes.number,
        browserIsMobile: PropTypes.bool,
        allowFullScreen: PropTypes.bool,
        /**
         * If any failure has to be displayed on the chat view footer.
         * It can be Network failure or any other failure.
         */
        failureConfig: PropTypes.shape ({
          /**
           * The string representing the failure.
           */
          message: PropTypes.string.isRequired,
          /**
           * Whether to show the loading icon or not.
           * If not, an error icon would be shown.
           */
          isLoading: PropTypes.bool,
          /**
           * Whether to render the retry btn or not
           */
          allowRetry: PropTypes.bool
        }),
        /**
         * On click handler for retry btn
         */
        onRetryBtnClick: PropTypes.func,
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
          chatViewStartNewConversation: PropTypes.string.isRequired,
          retryBtn: PropTypes.string.isRequired
        }).isRequired,
        footerIsActive: PropTypes.bool,
        onFooterFocus: PropTypes.func,
        onFooterBlur: PropTypes.func,
        userInput: USER_INPUT_PROP_TYPE,
        onSkipUserInput: PropTypes.func,
        onFilesChange: PropTypes.func,
        issueIsCreated: PropTypes.bool,
        fullPrivacyEnabled: PropTypes.bool,
        onCloseConversation: PropTypes.func.isRequired,
        botStepInProgress: PropTypes.bool.isRequired
      },

      render () {
        const {failureConfig} = this.props;

        if (failureConfig) {
          return this._renderFailure ();
        }

        const {
          footerIsActive,
          allowFullScreen,
          userInput: {
            type,
            disabled,
            required,
            skipLabel
          },
          issueIsCreated,
          onSkipUserInput
        } = this.props;
        const inputIsPillSelect = (type === USER_INPUT_TYPES.PILL_SELECT);
        const isPreIssue = !issueIsCreated;

        // Hide footer if
        // 1] Input is pill select - applicable for both preIssue and issue
        //    OR
        // 2] PreIssue and input is disabled
        if (inputIsPillSelect || (isPreIssue && disabled)) {
          return null;
        }

        let skipBtnWrapperEl = null;

        if (!required) {
          skipBtnWrapperEl = (
            <SkipButtonWrapper label={skipLabel}
                               className="hs-chat-footer__skip-btn-wrapper"
                               disabled={disabled}
                               onClick={onSkipUserInput} />
          );
        }

        const footerClasses = classes ("hs-footer", {
          "hs-footer--active" : footerIsActive,
          "hs-footer--full-screen": allowFullScreen,
          "hs-footer--failure": failureConfig
        });

        return (
          <div className={footerClasses}>
            {skipBtnWrapperEl}
            {this._renderFooterComponent ()}
          </div>
        );
      },

      /**
       * Render the active footer component
       */
      _renderFooterComponent () {
        const {
          activeFooter
        } = this.props;

        switch (activeFooter) {
          case ACTIVE_FOOTER.REPLY:
          case ACTIVE_FOOTER.SOLUTION_REJECTED:
            return this._renderUserInput ();

          case ACTIVE_FOOTER.CLOSED:
            return this._renderCloseConversationFooter ();

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
       * Render failure layout
       */
      _renderFailure () {
        const {isLoading, message} = this.props.failureConfig;

        const iconClasses = classes ("hs-chat-footer__icon", {
          "ion-alert-circled hs-chat-footer__icon-error": !isLoading,
          "ion-load-b ion--spinning": isLoading
        });

        return (
          <div className="hs-chat-footer">
            <div className="hs-chat-footer__field">
              <i className={iconClasses} />
              <span className="hs-chat-footer__field-item">
                {message}
              </span>
              {this._renderRetryBtn ()}
            </div>
          </div>
        );
      },

      /**
       * Render failure retry button
       */
      _renderRetryBtn () {
        if (!this.props.failureConfig.allowRetry) {
          return null;
        }

        const {retryBtn} = this.props.text;

        return (
          <a onClick={this.props.onRetryBtnClick} className="hs-chat-footer__field-item">
            {retryBtn}
          </a>
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
            errorMsg,
            disabled
          },
          onFooterFocus,
          onFooterBlur,
          browserIsMobile
        } = this.props;
        const footerClasses = classes (
          "hs-chat-footer", {
            "hs-chat-footer--form-error": errorMsg,
            "hs-chat-footer--form-invalid": disabled || !value.trim (),
            "hs-chat-footer--mobile": browserIsMobile
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
        if (type === USER_INPUT_TYPES.DEFAULT_INPUT) {
          inputComponentEl = (
            <ReplyBoxContainer className="hs-chat-footer__text-area" />
          );
        } else {
          const htmlInputType = this._getHtmlInputType (type);
          const inputPlaceholder = this._getInputPlaceholder (htmlInputType);

          inputComponentEl = (
            <input className="hs-chat-footer__text-field"
                   type={htmlInputType}
                   dir="auto"
                   disabled={disabled}
                   value={value}
                   ref={this._saveUserInputRef}
                   placeholder={inputPlaceholder}
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
              <div className="hs-chat-footer__error-text">
               {errorMsg}
              </div>
            </div>
          );
        }

        return (
          <div className={footerClasses}>
            {this._renderFooterLabelComponent ()}
            <div key="input" className="hs-chat-footer__field">
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
        const {
          userInput: {
            value
          },
          issueIsCreated,
          fullPrivacyEnabled,
          botStepInProgress
        } = this.props;

        if (value || !issueIsCreated || fullPrivacyEnabled || botStepInProgress) {
          return this._renderSendButton ();
        }

        return this._renderAttachmentButton ();
      },

      /**
       * Render send button
       */
      _renderSendButton () {
        const {
          userInput: {
            errorMsg
          },
          onSubmitReply
        } = this.props;
        const iconClasses = !errorMsg ? "ion-send" : "ion-alert-circled";

        return (
          <a className="hs-chat-footer__submit" onClick={onSubmitReply}>
            <i className={iconClasses} />
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
       * Render close button footer
       */
      _renderCloseConversationFooter () {
        const {
          onCloseConversation,
          text: {
            closeConversationBtn
          }
        } = this.props;
        const btnClasses = classes (
          "hs-button",
          "hs-footer__btn"
        );

        return (
          <div className="hs-chat-footer">
            <div className="hs-chat-footer__buttons-wrapper">
              <button className={btnClasses} onClick={onCloseConversation}>
                {closeConversationBtn}
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
            <div key="label" className="hs-chat-footer__field">
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
            <strong key="heading" className="hs-chat-footer__heading hs-chat-footer__reply-heading">
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
       * Reference to user input
       */
      _userInputRef: null,

      /**
       * Save user input reference
       * @param {Object} ref - DOM reference
       */
      _saveUserInputRef (ref) {
        this._userInputRef = ref;
      },

      /**
       * Return html input type for given input footer
       * @param {String} type - type of input footer
       * @returns {String} - html input type
       */
      _getHtmlInputType (type) {
        return HTML_INPUT_TYPES [type] || HTML_INPUT_TYPES.PLAIN_TEXT;
      },

      /**
       * Returns input placeholder string
       * @param {String} htmlInputType - html input type (text, number, string)
       * @returns {String} - html input placeholder
       */
      _getInputPlaceholder (htmlInputType) {
        const {
          userInput: {
            placeholder
          },
          text
        } = this.props;
        let inputPlaceholder = placeholder;

        // If date input is not supported, do not use placeholder sent by backend.
        // Use predefined unsupported date input placeholder text.
        if (htmlInputType === HTML_INPUT_TYPES.DATE &&
            !commonHelpers.isDateInputSupported ()) {
          inputPlaceholder = text.unsupportedDateInputPlaceholder;
        }

        return inputPlaceholder;
      },

      componentDidUpdate (prevProps) {
        const {browserIsMobile} = this.props;

        // If user input ref does not exists or browser is mobile, do not focus
        if (!this._userInputRef || browserIsMobile) {
          return;
        }

        const {
          userInput: {
            disabled: prevInputDisabled
          }
        } = prevProps;
        const {
          userInput: {
            disabled: currentInputDisabled
          }
        } = this.props;

        if (prevInputDisabled && !currentInputDisabled) {
          this._userInputRef.focus ();
        }
      }
    });
  }
);
