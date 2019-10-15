/**
 * Chat View footer Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 17, 2017
 */

define ("components/chatViewFooter",
  [
    "components/starRating",
    "components/jumpToLatestBtn",
    "components/containers/replyBox",
    "components/commons/fileInput",
    "components/commons/skipButtonWrapper",
    "constants/chatView",
    "constants/keyCodes",
    "constants/propTypes",
    "helpers/common",
    "gunpowder/utils/classes",
    "gunpowder/widgets/picker",
    "gunpowder/constants/widgets/picker",
    "extras/accessibility",
    "constants/accessibility",
    "constants/activeView"
  ],
  function (StarRating, JumpToLatestBtn, ReplyBoxContainer, FileInput, SkipButtonWrapper,
    CHAT_VIEW_CONSTANTS, KEY_CODES, customPropTypes, commonHelpers, classes,
    Picker, LIST_PICKER_CONSTANTS, ax, axConstants, activeViewConstants) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {
      ACTIVE_FOOTER,
      USER_INPUT_TYPES,
      HTML_INPUT_TYPES,
      PICKER_MIN_HEIGHT
    } = CHAT_VIEW_CONSTANTS;
    const {
      USER_INPUT_PROP_TYPE
    } = customPropTypes;

    const {
      TOGGLE_STATES: LIST_PICKER_TOGGLE_STATES
    } = LIST_PICKER_CONSTANTS;
    const {
      META_LIST_ITEM_NAME,
      DATA_LABELS,
      DATA_LABEL_SELECTORS,
      FOOTER_SELECTORS
    } = axConstants;

    return React.createClass ({
      displayName: "ChatViewFooter",
      propTypes: {
        activeFooter: PropTypes.string.isRequired,
        rating: PropTypes.number,
        browserIsMobile: PropTypes.bool,
        allowFullScreen: PropTypes.bool,
        userIsViewingPastMessages: PropTypes.bool,
        unreadCount: PropTypes.number,
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
        onJumpBtnClick: PropTypes.func,
        onSubmitReply: PropTypes.func.isRequired,
        onValueChangeInputField: PropTypes.func.isRequired,
        onAcceptResolutionQuestionClick: PropTypes.func.isRequired,
        onRejectResolutionQuestionClick: PropTypes.func.isRequired,
        onStartNewConversation: PropTypes.func.isRequired,
        onStarClick: PropTypes.func.isRequired,
        onListPickerToggleStateChange: PropTypes.func,
        onListPickerOptionSelect: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          resolutionQuestionAccept: PropTypes.string.isRequired,
          resolutionQuestionReject: PropTypes.string.isRequired,
          closeConversationBtn: PropTypes.string.isRequired,
          csatBotRequestMsg: PropTypes.string.isRequired,
          chatViewConversationResolutionQuestion: PropTypes.string.isRequired,
          chatViewIssueRejectionQuestion: PropTypes.string.isRequired,
          chatViewStartNewConversation: PropTypes.string.isRequired,
          retryBtn: PropTypes.string.isRequired,
          searchPlaceholder: PropTypes.string,
          noSearchResultsText: PropTypes.string
        }).isRequired,
        footerIsActive: PropTypes.bool,
        onFooterFocus: PropTypes.func,
        onFooterBlur: PropTypes.func,
        userInput: USER_INPUT_PROP_TYPE,
        onSkipUserInput: PropTypes.func,
        onFilesChange: PropTypes.func,
        issueIsCreated: PropTypes.bool,
        fullPrivacyEnabled: PropTypes.bool,
        userAttachmentsEnabled: PropTypes.bool,
        onCloseConversation: PropTypes.func.isRequired,
        botStepInProgress: PropTypes.bool.isRequired,
        onSelectStarRating: PropTypes.func,
        onUpdateStarRating: PropTypes.func
      },
      getInitialState () {
        return {
          pickerMaxHeight: PICKER_MIN_HEIGHT
        };
      },

      render () {
        const {
          failureConfig,
          footerIsActive,
          allowFullScreen,
          userIsViewingPastMessages,
          unreadCount,
          userInput: {
            type,
            disabled,
            required,
            skipLabel,
            listPicker: {
              toggleState: listPickerToggleState
            }
          },
          issueIsCreated,
          onSkipUserInput
        } = this.props;

        const showUnreadIndicator = unreadCount > 0;
        const jumpToLatestBtnEl = (
          <div className="hs-chat-footer__jump-to-latest-wrapper">
            <JumpToLatestBtn
              show={userIsViewingPastMessages}
              showUnreadIndicator={showUnreadIndicator}
              onClick={this.props.onJumpBtnClick} />
          </div>
        );

        if (failureConfig) {
          return (
            <div className="hs-footer hs-footer--failure">
              {this._renderFailure ()}
              <div className="hs-chat-footer__misc-actions-wrapper">
                {jumpToLatestBtnEl}
              </div>
            </div>
          );
        }

        const inputIsPillSelect = (type === USER_INPUT_TYPES.PILL_SELECT);
        const inputIsListPicker = (type === USER_INPUT_TYPES.LIST_PICKER);
        const listPickerIsClosed = (
          listPickerToggleState === LIST_PICKER_TOGGLE_STATES.CLOSED
        );
        const listPickerIsOpened = (
          listPickerToggleState === LIST_PICKER_TOGGLE_STATES.OPENED
        );

        const isPreIssue = !issueIsCreated;

        // Hide footer if
        // 1] Input is pill select - applicable for both preIssue and issue
        // 2] PreIssue and input is disabled
        // 3] Input is list picker and input is disabled
        if (
          inputIsPillSelect || ((isPreIssue || inputIsListPicker) && disabled)
        ) {
          return null;
        }

        /**
         * NOTE: "Jump to latest" and "skip" buttons are not semantically related.
         * However, for ease of layout and positioning, we are putting them in
         * one wrapper.
         */
        let miscActionsWrapper = null;

        if (!inputIsListPicker || listPickerIsClosed) {
          let skipBtnWrapperEl = null;

          if (!required) {
            const _setAxActiveIndex = this._setAxActiveIndex.bind (
              this, {
                selector: FOOTER_SELECTORS.SKIP_BTN
              }
            );
            const skipBtnDataLabels = {
              skipBtn: DATA_LABELS.CHAT.SKIP_BTN
            };

            skipBtnWrapperEl = (
              <SkipButtonWrapper
                label={skipLabel}
                className="hs-chat-footer__skip-btn-wrapper"
                disabled={disabled}
                onClick={onSkipUserInput}
                dataLabels={skipBtnDataLabels}
                onFocus={_setAxActiveIndex} />
            );
          }

          miscActionsWrapper = (
            <div className="hs-chat-footer__misc-actions-wrapper">
              {jumpToLatestBtnEl}
              {skipBtnWrapperEl}
            </div>
          );
        }

        const footerClasses = classes ("hs-footer", {
          "hs-footer--active" : footerIsActive,
          "hs-footer--full-screen": allowFullScreen,
          "hs-footer--failure": failureConfig,
          "hs-footer--list-picker-opened": listPickerIsOpened,
          "hs-footer--with-list-picker": inputIsListPicker && !listPickerIsOpened
        });

        return (
          <div className={footerClasses}>
            {miscActionsWrapper}
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

          // @TODO - Remove code to render close button after product ack
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
          <a onClick={this.props.onStartNewConversation} className="hs-chat-footer__field-item">
            <strong>{retryBtn}</strong>
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
            disabled,
            listPicker: {
              toggleState: listPickerToggleState
            }
          },
          onFooterFocus,
          onFooterBlur,
          browserIsMobile
        } = this.props;
        const inputIsListPicker = type === USER_INPUT_TYPES.LIST_PICKER;
        const listPickerIsOpened = (
          listPickerToggleState === LIST_PICKER_TOGGLE_STATES.OPENED
        );
        const footerClasses = classes (
          "hs-chat-footer", {
            "hs-chat-footer--form-error": errorMsg,
            "hs-chat-footer--form-invalid": disabled || !value.trim (),
            "hs-chat-footer--mobile": browserIsMobile,
            "hs-chat-footer--no-padding": inputIsListPicker,
            "hs-chat-footer--list-picker-opened": inputIsListPicker && listPickerIsOpened
          }
        );

        if (inputIsListPicker) {
          return (
            <div className={footerClasses}>
              {this._renderPicker ()}
            </div>
          );
        }

        // We need to render reply box for input component for input type plain text
        // and default input (when user is on issue state) as
        // a. User can enter long (multi line) text. (reply box supports multi line text)
        // b. Rendering normal input type 'text' will clip the text once it goes
        //    beyond available width
        // c. There can be label for input type plain text (this layout supports label)
        let inputComponentEl;
        if (type === USER_INPUT_TYPES.DEFAULT_INPUT) {
          const replyBoxDataLabels = {
            textArea: DATA_LABELS.CHAT.TEXT_AREA
          };

          inputComponentEl = (
            <ReplyBoxContainer
              className="hs-chat-footer__text-area"
              dataLabels={replyBoxDataLabels} />
          );
        } else {
          const htmlInputType = this._getHtmlInputType (type);
          const inputPlaceholder = this._getInputPlaceholder (htmlInputType);
          const _setAxActiveIndex = this._setAxActiveIndex.bind (
            this, {
              selector: FOOTER_SELECTORS.TEXT_FIELD
            }
          );

          const _onFooterFocus = () => {
            onFooterFocus ();
            _setAxActiveIndex ();
          };

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
                   onFocus={_onFooterFocus}
                   onBlur={onFooterBlur}
                   autoFocus
                   tabIndex="0"
                   data-label={DATA_LABELS.CHAT.TEXT_FIELD}
                   onClick={_setAxActiveIndex} />
          );
        }

        let errorMsgEl = null;
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
          userAttachmentsEnabled,
          botStepInProgress
        } = this.props;

        if (value || !issueIsCreated || fullPrivacyEnabled ||
          botStepInProgress || !userAttachmentsEnabled) {
          return this._renderSendButton ();
        }

        return this._renderAttachmentButton ();
      },

      /**
       * Renders the picker element
       */
      _renderPicker () {
        const {
          userInput: {
            options,
            label: headerLabel
          },
          onListPickerOptionSelect,
          text: {
            searchPlaceholder,
            noSearchResultsText: searchNoResultsText
          },
          browserIsMobile
        } = this.props;

        // @TODO: Pass browserIsMobile as a prop to Picker when it is
        // supported
        // JIRA: https://helpshift.atlassian.net/browse/FRON-3988
        const pickerClasses = classes (
          "hs-chat-footer__picker-field",
          {
            "hs-picker--mobile": browserIsMobile
          }
        );

        return (
          <Picker className={pickerClasses}
                  options={options}
                  onToggleStateChange={this._onPickerToggleStateChange}
                  onSelect={onListPickerOptionSelect}
                  searchPlaceholder={searchPlaceholder}
                  headerLabel={headerLabel}
                  searchNoResultsText={searchNoResultsText}
                  minHeight={PICKER_MIN_HEIGHT}
                  maxHeight={this.state.pickerMaxHeight} />
        );
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
        const _setAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: FOOTER_SELECTORS.SEND_BTN
          }
        );

        const _onSubmitReply = () => {
          onSubmitReply ();
          _setAxActiveIndex ();
        };

        return (
          <a
            className="hs-chat-footer__submit"
            onClick={_onSubmitReply}
            tabIndex="0"
            data-label={DATA_LABELS.CHAT.SEND_BTN}
            onFocus={_setAxActiveIndex}>
            <i className={iconClasses} />
          </a>
        );
      },

      /**
       * Render attachment button
       */
      _renderAttachmentButton () {
        const fileInputDataLabels = {
          attachmentBtn: DATA_LABELS.CHAT.ATTACHMENT_BTN
        };
        const _setAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: FOOTER_SELECTORS.ATTACHMENT_BTN
          }
        );

        return (
          <div
            onKeyDown={this._onFileInputKeyDown}
            data-label={DATA_LABELS.CHAT.ATTACHMENT_BTN}
            tabIndex="0"
            onFocus={_setAxActiveIndex}>
            <FileInput
              onChange={this.props.onFilesChange}
              noPadding
              labelClasses="hs-chat-footer__attachment-icon"
              iconClasses="ion-attachment"
              dataLabels={fileInputDataLabels}
              onSaveInputRef={this._saveInputRef} />
          </div>
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

        const _setAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: FOOTER_SELECTORS.CLOSE_CONVERSATION_BTN
          }
        );

        return (
          <div className="hs-chat-footer">
            <div className="hs-chat-footer__buttons-wrapper">
              <button
                className={btnClasses}
                onClick={onCloseConversation}
                onFocus={_setAxActiveIndex}
                tabIndex="0"
                data-label={DATA_LABELS.CHAT.CLOSE_CONVERSATION_BTN}>
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
        const starRatingDataLabels = {
          starRatingWrapper: DATA_LABELS.CHAT.STAR_RATING_WRAPPER
        };

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
                          onStarClick={this.props.onStarClick}
                          dataLabels={starRatingDataLabels}
                          onUpdateStarRating={this.props.onUpdateStarRating}
                          onSelectStarRating={this.props.onSelectStarRating} />
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

        const _setConversationResolutionWrapperAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: FOOTER_SELECTORS.CONVERSATION_RESOLUTION_WRAPPER
          }
        );

        const _setRejectResolutionAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: FOOTER_SELECTORS.SOLUTION_REJECT_BTN
          }
        );

        const _setAcceptResolutionAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: FOOTER_SELECTORS.SOLUTION_ACCEPT_BTN
          }
        );

        return (
          <div
            className="hs-chat-footer"
            tabIndex="0"
            data-label={DATA_LABELS.CHAT.CONVERSATION_RESOLUTION_WRAPPER}
            onClick={_setConversationResolutionWrapperAxActiveIndex}
            onFocus={_setConversationResolutionWrapperAxActiveIndex}>
            <div className="hs-chat-footer__heading" >
              <strong>{text.chatViewConversationResolutionQuestion}</strong>
            </div>
            <div className="hs-chat-footer__buttons-wrapper">
              <button className={btnClasses}
                      onClick={onRejectResolutionQuestionClick}
                      onFocus={_setRejectResolutionAxActiveIndex}
                      data-label={DATA_LABELS.CHAT.SOLUTION_REJECT_BTN}
                      tabIndex="0">
                {text.resolutionQuestionReject}
              </button>
              <button className={btnClasses}
                      onClick={onAcceptResolutionQuestionClick}
                      onFocus={_setAcceptResolutionAxActiveIndex}
                      data-label={DATA_LABELS.CHAT.SOLUTION_ACCEPT_BTN}
                      tabIndex="0">
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
        const _setAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: FOOTER_SELECTORS.NEW_CONVERSATION_BTN
          }
        );

        return (
          <div className="hs-chat-footer">
            <div className="hs-chat-footer__buttons-wrapper">
              <button
                className={btnClasses}
                onClick={this.props.onStartNewConversation}
                onFocus={_setAxActiveIndex}
                tabIndex="0"
                data-label={DATA_LABELS.CHAT.NEW_CONVERSATION_BTN}>
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

      _fileInputRef: null,

      /**
       * Set ref for fileInput component
       */
      _saveInputRef (fileInputRef) {
        this._fileInputRef = fileInputRef;
      },

      /**
       * Handler for keyDown event on attachment wrapper
       * @param {Object} ev - Event for key down
       */
      _onFileInputKeyDown (ev) {
        if (ev.keyCode === KEY_CODES.ENTER || ev.keyCode === KEY_CODES.SPACE) {
          if (this._fileInputRef) {
            this._fileInputRef.click ();
            ax.setActiveIndex ({selector: FOOTER_SELECTORS.ATTACHMENT_BTN});
          }
        }
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
       * Handle change in toggle state of the Picker
       * @param {String} toggleState - Toggle state of the Picker
       */
      _onPickerToggleStateChange (toggleState) {
        if (toggleState === LIST_PICKER_TOGGLE_STATES.OPENED) {
          ax.backupSelectors (META_LIST_ITEM_NAME.CHAT.MESSAGE_LIST);
          ax.replaceSelectors ({
            name: META_LIST_ITEM_NAME.CHAT.MESSAGE_LIST,
            selectors: []
          });
        } else if (toggleState === LIST_PICKER_TOGGLE_STATES.CLOSED) {
          const backedupSelectors = ax.restoreSelectors (META_LIST_ITEM_NAME.CHAT.MESSAGE_LIST);

          ax.replaceSelectors ({
            name: META_LIST_ITEM_NAME.CHAT.MESSAGE_LIST,
            selectors: backedupSelectors
          });
        }
        this.props.onListPickerToggleStateChange (toggleState);
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

      /**
       * Returns array of pills option selectors
       *
       * @param {Array} options - Option for option pills
       * @returns {Array} - Unique selector list of option pills
       */
      _getPillsOptionSelectorList (options) {
        const prefix = DATA_LABELS.CHAT.OPTION_PILL_PREFIX;
        const optionsSelectorList = [];

        options.forEach ((option) => {
          const selectors = `[data-label=${prefix}${option.value}]`;

          optionsSelectorList.push (selectors);
        });

        return optionsSelectorList;
      },

      /**
       * This function checks for sub-type of reply footer and
       * returns corresponding footer selector list
       *
       * @param {Object} userInput - Data for footer
       * @param {String} userInput.type - Type of rply footer
       * @param {Array} userInput.options - Option list for picker & option pills
       * @returns {Array} - Reply footer selectors list
       */
      _getReplyFooterSelectors (userInput) {
        const {type} = userInput;

        switch (type) {
          case USER_INPUT_TYPES.DEFAULT_INPUT:
            return DATA_LABEL_SELECTORS.CHAT.FOOTER.DEFAULT_INPUT;

          case USER_INPUT_TYPES.PLAIN_TEXT:
          case USER_INPUT_TYPES.EMAIL:
          case USER_INPUT_TYPES.NUMERIC:
          case USER_INPUT_TYPES.DATE:
            return DATA_LABEL_SELECTORS.CHAT.FOOTER.PLAIN_TEXT;

          case USER_INPUT_TYPES.PILL_SELECT:
            const selectorList = DATA_LABEL_SELECTORS.CHAT.FOOTER.OPTION_PILL;
            const optionsSelectorList = this._getPillsOptionSelectorList (
              userInput.options
            );

            return selectorList.concat (optionsSelectorList);

          case USER_INPUT_TYPES.LIST_PICKER:
            return DATA_LABEL_SELECTORS.CHAT.FOOTER.PICKER;
        }
      },

      /**
       * This function checks for the type of footer &
       * returns corresponding selector list
       *
       * @param {String} activeFooter - Type of the footer
       * @param {Object} userInput - Data for the footer
       * @returns {Array} - Footer selectors list
       */
      _getActiveFooterSelectors (activeFooter, userInput) {
        switch (activeFooter) {
          case ACTIVE_FOOTER.REPLY:
            return this._getReplyFooterSelectors (userInput);

          case ACTIVE_FOOTER.CONVERSATION_RESOLUTION_QUESTION:
            return DATA_LABEL_SELECTORS.CHAT.FOOTER.RESOLUTION_QUESTION;

          case ACTIVE_FOOTER.SOLUTION_REJECTED:
            return DATA_LABEL_SELECTORS.CHAT.FOOTER.SOLUTION_REJECTED;

          case ACTIVE_FOOTER.CSAT:
            return DATA_LABEL_SELECTORS.CHAT.FOOTER.CSAT;

          case ACTIVE_FOOTER.START_NEW_CONVERSATION:
            return DATA_LABEL_SELECTORS.CHAT.FOOTER.START_NEW_CONVERSATION;

          case ACTIVE_FOOTER.CLOSED:
            return DATA_LABEL_SELECTORS.CHAT.FOOTER.CLOSED;
        }
      },

      /**
       * This function is called on focus or click event on element
       * It calls ax function to update active index
       *
       * @param {Object} config.selector - Selector value
       */
      _setAxActiveIndex (config) {
        ax.setActiveIndex (config);
      },

      /**
       * This function do following things
       * - Clear delayed focus on componentDidUpdate to clear batched focus items
       * - Update the footer object in metaList in Ax module
       *
       * @param {Object} - prev props befor update
       */
      componentDidUpdate (prevProps) {
        ax.clearDelayFocus ();

        const {browserIsMobile, userInput, activeFooter} = this.props;
        const activeFooterIsChanged = (activeFooter !== prevProps.activeFooter);
        const activeFooterIsReply = (activeFooter === ACTIVE_FOOTER.REPLY);
        const userInputTypeIsChanged = (userInput.type !== prevProps.userInput.type);
        const userInputIsPillSelect = (userInput.type === USER_INPUT_TYPES.PILL_SELECT);
        const userInputIsListPicker = (userInput.type === USER_INPUT_TYPES.LIST_PICKER);
        const userInputIsSelectOption = (userInputIsPillSelect || userInputIsListPicker);
        const userInputIsEnterText = (
          userInput.type === USER_INPUT_TYPES.PLAIN_TEXT ||
          userInput.type === USER_INPUT_TYPES.EMAIL ||
          userInput.type === USER_INPUT_TYPES.NUMERIC ||
          userInput.type === USER_INPUT_TYPES.DATE ||
          userInput.type === USER_INPUT_TYPES.DEFAULT_INPUT
        );
        const selectOptionIsSubmitted = (
          !userInput.selectedOption &&
          prevProps.userInput.selectedOption
        );
        const textValueIsSubmitted = (
          !userInput.value &&
          prevProps.userInput.value
        );
        // User input is considered refreshed when selected option or entered value resets to empty
        const userInputIsRefreshed = !userInputTypeIsChanged && ((
            userInputIsSelectOption &&
            selectOptionIsSubmitted
          ) || (
            userInputIsEnterText &&
            textValueIsSubmitted
        ));
        let requiredFooterSelectors;

        // When footer changes, reset the active index and focus the first element of footer
        if (activeFooterIsChanged) {
          requiredFooterSelectors = this._getActiveFooterSelectors (activeFooter, userInput);

          ax.replaceSelectors ({
            name: META_LIST_ITEM_NAME.CHAT.FOOTER,
            selectors: requiredFooterSelectors
          });
          ax.setFlatListActiveIndex (0);
          ax.focus ();
        } else if (activeFooterIsReply && (userInputTypeIsChanged || userInputIsRefreshed)) {
          requiredFooterSelectors = this._getReplyFooterSelectors (userInput);

          ax.replaceSelectors ({
            name: META_LIST_ITEM_NAME.CHAT.FOOTER,
            selectors: requiredFooterSelectors
          });
          ax.setFlatListActiveIndex (0);
          ax.focus ();
        }

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
      },

      /**
       * For first footer push all the selectors in meta-list and focus the first element
       */
      componentDidMount () {
        ax.setActiveView (activeViewConstants.CHAT);

        const {activeFooter, userInput, issueIsCreated} = this.props;
        const inputIsPillSelect = (userInput.type === USER_INPUT_TYPES.PILL_SELECT);
        const inputIsListPicker = (userInput.type === USER_INPUT_TYPES.LIST_PICKER);
        const isPreIssue = !issueIsCreated;
        const requiredFooterSelectors = this._getActiveFooterSelectors (activeFooter, userInput);

        ax.replaceSelectors ({
          name: META_LIST_ITEM_NAME.CHAT.FOOTER,
          selectors: requiredFooterSelectors
        });

        // In below cases footer value is null, so delayed the focus when it is render
        if (!(
          inputIsPillSelect || ((isPreIssue || inputIsListPicker) && userInput.disabled)
        )) {
          ax.focus ();
        } else {
          ax.delayFocus ();
        }

        // Calculate the maximum height the picker widget can have.
        const parentNode = document.querySelector (".hs-dnd-wrapper");
        this.setState ({
          pickerMaxHeight: parentNode.getBoundingClientRect ().height
        });
      }
    });
  }
);
