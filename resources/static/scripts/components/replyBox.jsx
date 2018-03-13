/**
 * ReplyBox Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/replyBox",
  [
    "constants/keyCodes",
    "components/commons/fileInput",
    "gunpowder/utils/classes",
    "gunpowder/widgets/textareaAutosize"
  ],
  function (KEY_CODES, FileInput, classes, TextareaAutosize) {
    "use strict";

    const PropTypes = React.PropTypes;

    const TEXT_AREA_MIN_ROWS = 1,
          TEXT_AREA_MAX_ROWS = 5;

    return React.createClass ({
      displayName: "ReplyBox",
      propTypes: {
        /**
         * Reply textarea value.
         */
        value: PropTypes.string.isRequired,
        disabled: PropTypes.bool,
        widgetIsOpened: PropTypes.bool,
        onChangeReplyBoxValue: PropTypes.func.isRequired,
        onSubmitReply: PropTypes.func.isRequired,
        onFilesChange: PropTypes.func.isRequired,
        browserIsMobile: PropTypes.bool.isRequired,
        text: PropTypes.shape ({
          replyBtnPlaceholder: PropTypes.string.isRequired
        }).isRequired,
        issueIsCreated: PropTypes.bool.isRequired,
        onFooterFocus: PropTypes.func,
        onFooterBlur: PropTypes.func,
        replyBoxHeading: PropTypes.string
      },

      render () {
        const {
          text,
          value,
          disabled,
          onFooterFocus,
          onFooterBlur,
          replyBoxHeading
        } = this.props;

        // @TODO :- Do not use style of different component here!
        // Create a separate style sheet for this component
        const replyBoxClasses = classes (
          "hs-chat-footer", {
            "hs-chat-footer--form-invalid": disabled || !value.trim ()
          }
        );
        let replyBoxHeadingEl = null;

        if (replyBoxHeading) {
          replyBoxHeadingEl = (
            <strong className="hs-chat-footer__heading hs-chat-footer__reply-heading">
              {replyBoxHeading}
            </strong>
          );
        }

        return (
          <div className={replyBoxClasses}>
            {replyBoxHeadingEl}
            <div className="hs-chat-footer__field">
              <TextareaAutosize value={this.props.value}
                                className="hs-chat-footer__text-area"
                                onKeyDown={this._onReplyTextKeyDown}
                                onChange={this._onReplyTextChange}
                                onFocus={onFooterFocus}
                                onBlur={onFooterBlur}
                                minRows={TEXT_AREA_MIN_ROWS}
                                maxRows={TEXT_AREA_MAX_ROWS}
                                onHeightChange={this._onReplyBoxHeightChange}
                                placeholder={text.replyBtnPlaceholder}
                                disabled={disabled}
                                autoFocus
                                ref={this._saveTextAreaRef}
                                dir="auto" />
                {this._renderReplyBoxAction ()}
            </div>
          </div>
        );
      },

      /**
       * Render reply box action
       */
      _renderReplyBoxAction () {
        if (this.props.value || !this.props.issueIsCreated) {
          return this._renderSendButton ();
        }
        return this._renderAttachmentButton ();
      },

      /**
       * Render send button
       */
      _renderSendButton () {
        return (
          <a className="hs-chat-footer__submit" onClick={this._onReplyClick}>
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
       * Handler for reply box textarea height change.
       */
      _onReplyBoxHeightChange () {
        // @TODO: Handle scroll
      },

      /**
       * Handler for reply text area key down.
       */
      _onReplyTextKeyDown (ev) {
        if (ev.keyCode === KEY_CODES.ENTER) {
          if (!ev.shiftKey) {
            this._submitReply ();
            ev.preventDefault ();
          }
        } else if (ev.keyCode === KEY_CODES.ESCAPE) {
          ev.target.blur ();
        }
      },
      /**
       * Handler for reply text area change event.
       */
      _onReplyTextChange (ev) {
        this.props.onChangeReplyBoxValue (ev.target.value);
      },

      /**
       * Handler for reply button click.
       */
      _onReplyClick () {
        this._submitReply ();
      },

      /**
       * Submit reply message.
       */
      _submitReply () {
        this.props.onSubmitReply ();
      },

      /**
       * Reference of textarea
       */
      _textAreaRef: null,

      /**
       * Save textarea reference
       * @param {Object} ref - DOM reference
       */
      _saveTextAreaRef (ref) {
        this._textAreaRef = ref;
      },

      componentDidUpdate (prevProps) {
        // Focus the textarea in following cases
        // 1] When message and attachment is added
        // 2] Widget is opened
        // 3] Browser is not mobile
        const messageIsAdded = (prevProps.disabled && !this.props.disabled);
        const widgetIsOpened = (!prevProps.widgetIsOpened && this.props.widgetIsOpened);
        const browserIsNotMobile = !this.props.browserIsMobile;
        if ((messageIsAdded || widgetIsOpened) && browserIsNotMobile) {
          this._textAreaRef.focus ();
        }
      }
    });
  }
);
