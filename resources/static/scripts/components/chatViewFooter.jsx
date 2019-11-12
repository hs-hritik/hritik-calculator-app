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
      METALIST_GROUP_NAME,
      METALIST_ITEMS,
      FOOTER_SELECTORS_LIST_MAP
    } = axConstants;

    return React.createClass ({
      displayName: "ChatViewFooter",
      propTypes: {
        widgetIsMinimized: PropTypes.bool,
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
          noSearchResultsText: PropTypes.string,
          ariaLabelSendMessage: PropTypes.string,
          ariaLabelJumpToLatestBtn: PropTypes.string,
          ariaLabelClearSearchInput: PropTypes.string,
          ariaLabelOptionsList: PropTypes.string,
          ariaLabelSearchList: PropTypes.string,
          ariaLabelCloseSearch: PropTypes.string,
          ariaLabelAttachFiles: PropTypes.string
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
          onSkipUserInput,
          text
        } = this.props;

        const showUnreadIndicator = unreadCount > 0;
        const jumpToLatestBtnEl = (
          <div className="hs-chat-footer__jump-to-latest-wrapper">
            <JumpToLatestBtn
              show={userIsViewingPastMessages}
              showUnreadIndicator={showUnreadIndicator}
              onClick={this.props.onJumpBtnClick}
              ariaLabel={text.ariaLabelJumpToLatestBtn} />
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
                selector: METALIST_ITEMS.CHAT.SKIP_BTN.SELECTOR
              }
            );
            const skipBtnDataLabels = {
              skipBtn: METALIST_ITEMS.CHAT.SKIP_BTN.DATA_LABEL
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
          browserIsMobile,
          activeFooter,
          text
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
          const {
            CHAT: {
              FOOTER: {
                TEXT_AREA:{
                  DATA_LABEL: replyBoxDataLabel
                }
              }
            }
          } = METALIST_ITEMS;
          let ariaLabel;

          if (activeFooter === ACTIVE_FOOTER.SOLUTION_REJECTED) {
            ariaLabel = text.chatViewIssueRejectionQuestion;
          }

          inputComponentEl = (
            <ReplyBoxContainer
              className="hs-chat-footer__text-area"
              dataLabel={replyBoxDataLabel}
              ariaLabel={ariaLabel} />
          );
        } else {
          const htmlInputType = this._getHtmlInputType (type);
          const inputPlaceholder = this._getInputPlaceholder (htmlInputType);
          const _setAxActiveIndex = this._setAxActiveIndex.bind (
            this, {
              selector: METALIST_ITEMS.CHAT.FOOTER.TEXT_FIELD.SELECTOR
            }
          );

          const _onFooterFocus = () => {
            onFooterFocus ();
            _setAxActiveIndex ();
          };
          const inputIsInvalid = !!errorMsg;

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
                   data-label={METALIST_ITEMS.CHAT.FOOTER.TEXT_FIELD.DATA_LABEL}
                   onClick={_setAxActiveIndex}
                   aria-invalid={inputIsInvalid}
                   aria-required={true} />
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
            noSearchResultsText: searchNoResultsText,
            ariaLabelClearSearchInput,
            ariaLabelOptionsList,
            ariaLabelSearchList,
            ariaLabelCloseSearch
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
        const pickerAriaLabels = {
          optionsList: ariaLabelOptionsList,
          clearSearchInput: ariaLabelClearSearchInput,
          searchList: ariaLabelSearchList,
          closeSearch: ariaLabelCloseSearch
        };

        return (
          <Picker className={pickerClasses}
                  options={options}
                  onToggleStateChange={this._onPickerToggleStateChange}
                  onSelect={onListPickerOptionSelect}
                  searchPlaceholder={searchPlaceholder}
                  headerLabel={headerLabel}
                  searchNoResultsText={searchNoResultsText}
                  minHeight={PICKER_MIN_HEIGHT}
                  maxHeight={this.state.pickerMaxHeight}
                  axIsSupported={true}
                  onFocusableItemsChange={this._onFocusItemsChanged}
                  onFocusChange={this._onPickerFocusChange}
                  ariaLabels={pickerAriaLabels} />
        );
      },

      /**
       * Render send button
       */
      _renderSendButton () {
        const {
          userInput: {
            errorMsg,
            disabled: userInputIsDisabled
          },
          onSubmitReply,
          text: {
            ariaLabelSendMessage
          }
        } = this.props;
        const iconClasses = !errorMsg ? "ion-send" : "ion-alert-circled";
        const _setAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: METALIST_ITEMS.CHAT.FOOTER.SEND_BTN.SELECTOR
          }
        );

        const _onSubmitReply = () => {
          onSubmitReply ();
          _setAxActiveIndex ();
        };
        const fieldIsInvalid = !!errorMsg;
        const inputAriaLabel = ariaLabelSendMessage;

        return (
          <a
            className="hs-chat-footer__submit"
            onClick={_onSubmitReply}
            tabIndex="0"
            data-label={METALIST_ITEMS.CHAT.FOOTER.SEND_BTN.DATA_LABEL}
            onFocus={_setAxActiveIndex}
            aria-label={inputAriaLabel}
            role="button"
            aria-disabled={userInputIsDisabled}
            aria-invalid={fieldIsInvalid}>
            <i className={iconClasses} />
          </a>
        );
      },

      /**
       * Render attachment button
       */
      _renderAttachmentButton () {
        const {text} = this.props;
        const _setAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: METALIST_ITEMS.CHAT.FOOTER.ATTACHMENT_BTN.SELECTOR
          }
        );

        return (
          <div
            onKeyDown={this._onFileInputKeyDown}
            data-label={METALIST_ITEMS.CHAT.FOOTER.ATTACHMENT_BTN.DATA_LABEL}
            tabIndex="0"
            onFocus={_setAxActiveIndex}
            aria-label={text.ariaLabelAttachFiles}
            role="button">
            <FileInput
              onChange={this.props.onFilesChange}
              noPadding
              labelClasses="hs-chat-footer__attachment-icon"
              iconClasses="ion-attachment"
              onSaveInputRef={this._saveInputRef}/>
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
            selector: METALIST_ITEMS.CHAT.FOOTER.CLOSE_CONVERSATION_BTN.SELECTOR
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
                data-label={METALIST_ITEMS.CHAT.FOOTER.CLOSE_CONVERSATION_BTN.DATA_LABEL}>
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
          starRatingWrapper: METALIST_ITEMS.CHAT.FOOTER.STAR_RATING_WRAPPER.DATA_LABEL
        };
        const csatBotRequestMessage = this.props.text.csatBotRequestMsg;

        return (
          <div className="hs-chat-footer">
            <div className="hs-chat-footer__heading" aria-hidden={true}>
              <strong className="hs-chat-footer__heading-text">
                {csatBotRequestMessage}
              </strong>
            </div>
            <div
              className="hs-chat-footer__csat-footer"
              aria-label={csatBotRequestMessage}>
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
            selector: METALIST_ITEMS.CHAT.FOOTER.CONVERSATION_RESOLUTION_WRAPPER.SELECTOR
          }
        );

        const _setRejectResolutionAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: METALIST_ITEMS.CHAT.FOOTER.SOLUTION_REJECT_BTN.SELECTOR
          }
        );

        const _setAcceptResolutionAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: METALIST_ITEMS.CHAT.FOOTER.SOLUTION_ACCEPT_BTN.SELECTOR
          }
        );

        return (
          <div
            className="hs-chat-footer"
            tabIndex="0"
            data-label={METALIST_ITEMS.CHAT.FOOTER.CONVERSATION_RESOLUTION_WRAPPER.DATA_LABEL}
            onClick={_setConversationResolutionWrapperAxActiveIndex}
            onFocus={_setConversationResolutionWrapperAxActiveIndex}
            aria-label={text.chatViewConversationResolutionQuestion}>
            <div className="hs-chat-footer__heading" >
              <strong>{text.chatViewConversationResolutionQuestion}</strong>
            </div>
            <div className="hs-chat-footer__buttons-wrapper">
              <button className={btnClasses}
                      onClick={onRejectResolutionQuestionClick}
                      onFocus={_setRejectResolutionAxActiveIndex}
                      data-label={METALIST_ITEMS.CHAT.FOOTER.SOLUTION_REJECT_BTN.DATA_LABEL}
                      tabIndex="0"
                      aria-label={text.resolutionQuestionReject}>
                {text.resolutionQuestionReject}
              </button>
              <button className={btnClasses}
                      onClick={onAcceptResolutionQuestionClick}
                      onFocus={_setAcceptResolutionAxActiveIndex}
                      data-label={METALIST_ITEMS.CHAT.FOOTER.SOLUTION_ACCEPT_BTN.DATA_LABEL}
                      tabIndex="0"
                      aria-label={text.resolutionQuestionAccept}>
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
            selector: METALIST_ITEMS.CHAT.FOOTER.NEW_CONVERSATION_BTN.SELECTOR
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
                data-label={METALIST_ITEMS.CHAT.FOOTER.NEW_CONVERSATION_BTN.DATA_LABEL}>
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
            <strong
              key="heading"
              className="hs-chat-footer__heading hs-chat-footer__reply-heading"
              aria-hidden={true}>
              {chatViewIssueRejectionQuestion}
            </strong>
          );
        }

        return [headingEl, labelEl];
      },

      /**
       * This Handler is called on focus or click event on picker element
       * It calls ax function to update active index
       *
       * @param {String} config.selector - Current focused element selector
       */
      _onPickerFocusChange (config) {
        ax.setActiveIndex (config);
      },

      /**
       * Support accessiblity depends on toggle state
       * 1) Depending on the toggleState, backup or restore selectors
       * 2) Replace the footer selectors
       * 3) Focus the element of the picker
       * @param {String} toggleState - Whether the picker is in "closed", "opened" state
       * @param {Array} selectors - List of current visible selectors
       * @param {String} firstFocusItem - To be focused selector
       */
      _onFocusItemsChanged (toggleState, selectors, firstFocusItem) {
        if (toggleState === LIST_PICKER_TOGGLE_STATES.OPENED) {
          ax.backupSelectors (METALIST_GROUP_NAME.CHAT.MESSAGE_LIST);
          ax.replaceSelectors ({
            group: METALIST_GROUP_NAME.CHAT.MESSAGE_LIST,
            selectors: []
          });
        } else if (toggleState === LIST_PICKER_TOGGLE_STATES.CLOSED) {
          const backedupSelectors = ax.restoreSelectors (METALIST_GROUP_NAME.CHAT.MESSAGE_LIST);

          if (backedupSelectors) {
            ax.replaceSelectors ({
              group: METALIST_GROUP_NAME.CHAT.MESSAGE_LIST,
              selectors: backedupSelectors
            });
          }
        }

        ax.replaceSelectors ({
          group: METALIST_GROUP_NAME.CHAT.FOOTER,
          selectors: selectors
        });

        ax.setActiveIndex ({selector: firstFocusItem});
        ax.delayFocus ();
        ax.clearDelayFocus ();
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
            ax.setActiveIndex ({selector: METALIST_ITEMS.ATTACHMENT_BTN});
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
        const {
          userInput
        } = this.props;
        const prefix = METALIST_ITEMS.CHAT.FOOTER.OPTION_PILL_PREFIX.DATA_LABEL;
        const optionsSelectorList = [];
        const pillIsSkipable = !userInput.required;

        options.forEach ((option) => {
          const selectors = `[data-label=${prefix}${option.value}]`;

          optionsSelectorList.push (selectors);
        });

        if (pillIsSkipable) {
          optionsSelectorList.push (METALIST_ITEMS.CHAT.SKIP_BTN.SELECTOR);
        }

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
            return FOOTER_SELECTORS_LIST_MAP.DEFAULT_INPUT;

          case USER_INPUT_TYPES.PLAIN_TEXT:
          case USER_INPUT_TYPES.EMAIL:
          case USER_INPUT_TYPES.NUMERIC:
          case USER_INPUT_TYPES.DATE:
            return FOOTER_SELECTORS_LIST_MAP.PLAIN_TEXT;

          case USER_INPUT_TYPES.PILL_SELECT:
            const selectorList = FOOTER_SELECTORS_LIST_MAP.OPTION_PILL;
            const optionsSelectorList = this._getPillsOptionSelectorList (
              userInput.options
            );

            return selectorList.concat (optionsSelectorList);

          case USER_INPUT_TYPES.LIST_PICKER:
            return [];

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
            return FOOTER_SELECTORS_LIST_MAP.RESOLUTION_QUESTION;

          case ACTIVE_FOOTER.SOLUTION_REJECTED:
            return FOOTER_SELECTORS_LIST_MAP.SOLUTION_REJECTED;

          case ACTIVE_FOOTER.CSAT:
            return FOOTER_SELECTORS_LIST_MAP.CSAT;

          case ACTIVE_FOOTER.START_NEW_CONVERSATION:
            return FOOTER_SELECTORS_LIST_MAP.START_NEW_CONVERSATION;

          case ACTIVE_FOOTER.CLOSED:
            return FOOTER_SELECTORS_LIST_MAP.CLOSE_CONVERSATION;
        }
      },

      /**
       * This function is called on focus or click event on element
       * It calls ax function to update active index
       *
       * @param {Object} config.selector - Selector value
       * @param {Object} ev - Click/Focus event
       */
      _setAxActiveIndex (config, ev) {
        if (ev) {
          ev.stopPropagation ();
        }

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
        const listPickerIsClosed = (
          userInput.listPicker.toggleState === LIST_PICKER_TOGGLE_STATES.CLOSED
        );
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
        const userInputIsSkipable = !userInput.required;
        let requiredFooterSelectors;

        // Add skip selector when footer is not required and footer type is not pills
        // Otherwise empty skip selectors list
        if (
          ((!userInputIsListPicker || listPickerIsClosed) && userInputIsSkipable) &&
          !userInputIsPillSelect
        ) {
          ax.replaceSelectors ({
            group: METALIST_GROUP_NAME.CHAT.SKIP_BTN,
            selectors: [METALIST_ITEMS.CHAT.SKIP_BTN.SELECTOR]
          });
        } else {
          ax.replaceSelectors ({
            group: METALIST_GROUP_NAME.CHAT.SKIP_BTN,
            selectors: []
          });
        }

        // When footer changes, reset the active index and focus the first element of footer
        if (activeFooterIsChanged) {
          requiredFooterSelectors = this._getActiveFooterSelectors (activeFooter, userInput);

          if (requiredFooterSelectors && requiredFooterSelectors.length) {
            ax.replaceSelectors ({
              group: METALIST_GROUP_NAME.CHAT.FOOTER,
              selectors: requiredFooterSelectors
            });
            ax.setFlatListActiveIndex (0);
            ax.focus ();
          }
        } else if (activeFooterIsReply && (userInputTypeIsChanged || userInputIsRefreshed)) {
          requiredFooterSelectors = this._getReplyFooterSelectors (userInput);

          if (requiredFooterSelectors && requiredFooterSelectors.length) {
            ax.replaceSelectors ({
              group: METALIST_GROUP_NAME.CHAT.FOOTER,
              selectors: requiredFooterSelectors
            });
            ax.setFlatListActiveIndex (0);
            ax.focus ();
          }
        }

        // If user input ref does not exists or browser is mobile, do not focus
        if (!this._userInputRef || browserIsMobile) {
          return;
        }

        const {
          userInput: {
            disabled: prevInputDisabled
          },
          widgetIsMinimized: widgetWasMinimized
        } = prevProps;
        const {
          userInput: {
            disabled: currentInputDisabled
          },
          widgetIsMinimized
        } = this.props;

        if (
          (prevInputDisabled && !currentInputDisabled) ||
          (widgetWasMinimized && !widgetIsMinimized)
        ) {
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

        if (requiredFooterSelectors && requiredFooterSelectors.length) {
          ax.replaceSelectors ({
            group: METALIST_GROUP_NAME.CHAT.FOOTER,
            selectors: requiredFooterSelectors
          });
        }

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
