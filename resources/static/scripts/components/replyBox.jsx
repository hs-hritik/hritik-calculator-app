/**
 * ReplyBox Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/replyBox",
  [
    "constants/keyCodes",
    "gunpowder/widgets/textareaAutosize"
  ],
  function (KEY_CODES, TextareaAutosize) {
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
        browserIsMobile: PropTypes.bool.isRequired,
        onFooterFocus: PropTypes.func,
        onFooterBlur: PropTypes.func,
        placeholder: PropTypes.string
      },

      render () {
        const {
          value,
          disabled,
          onFooterFocus,
          onFooterBlur,
          className,
          placeholder
        } = this.props;

        return (
          <TextareaAutosize value={value}
                            className={className}
                            onKeyDown={this._onReplyTextKeyDown}
                            onChange={this._onReplyTextChange}
                            onFocus={onFooterFocus}
                            onBlur={onFooterBlur}
                            minRows={TEXT_AREA_MIN_ROWS}
                            maxRows={TEXT_AREA_MAX_ROWS}
                            onHeightChange={this._onReplyBoxHeightChange}
                            placeholder={placeholder}
                            disabled={disabled}
                            autoFocus
                            ref={this._saveTextAreaRef}
                            dir="auto" />
        );
      },

      /**
       * Handler for reply text area key down.
       */
      _onReplyTextKeyDown (ev) {
        if (ev.keyCode === KEY_CODES.ENTER) {
          if (!ev.shiftKey) {
            this.props.onSubmitReply ();
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
