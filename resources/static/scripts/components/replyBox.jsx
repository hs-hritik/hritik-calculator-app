/**
 * ReplyBox Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/replyBox",
  [
    "constants/keyCodes",
    "gunpowder/utils/object",
    "gunpowder/widgets/textareaAutosize"
  ],
  function (KEY_CODES, objectUtils, TextareaAutosize) {
    "use strict";

    const TEXT_AREA_MIN_ROWS = 1,
          TEXT_AREA_MAX_ROWS = 5;

    return createReactClass ({
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
      },

      componentWillUnmount () {
        // In IE 11, the reply box focus remains visible even after this component
        // unmounts resulting in a visible cursor over the other input buttons.
        // This makes the buttons of the options input un-clickable. So, we are
        // going to remove the focus from the reply box before it unmounts.
        // `this._textAreaRef` is a reference to reply box component. Reply box
        // component internally has reference to actual text area element and is
        // saved in property `ta`.
        if (objectUtils.getIn (this._textAreaRef, ["refs", "ta"])) {
          if (typeof this._textAreaRef.refs.ta.blur === "function") {
            this._textAreaRef.refs.ta.blur ();
          }
        }
      }
    });
  }
);
