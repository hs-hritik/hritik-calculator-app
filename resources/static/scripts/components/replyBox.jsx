/**
 * ReplyBox Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define("components/replyBox", [
  "constants/keyCodes",
  "gunpowder/utils/object",
  "gunpowder/widgets/textareaAutosize",
  "extras/accessibility",
  "constants/accessibility"
], function(KEY_CODES, objectUtils, TextareaAutosize, ax, axConstants) {
  "use strict";

  const TEXT_AREA_MIN_ROWS = 1,
    TEXT_AREA_MAX_ROWS = 5;
  const {METALIST_ITEMS} = axConstants;

  return createReactClass({
    displayName: "ReplyBox",
    propTypes: {
      /**
       * Reply textarea value.
       */
      value: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
      /**
       * Whether the submit reply should be disabled.
       */
      disableSubmit: PropTypes.bool,
      widgetIsOpened: PropTypes.bool,
      onChangeReplyBoxValue: PropTypes.func.isRequired,
      onSubmitReply: PropTypes.func.isRequired,
      /**
       * Handler to be called when reply box height gets changed
       */
      onHeightChange: PropTypes.func.isRequired,
      browserIsMobile: PropTypes.bool.isRequired,
      onFooterFocus: PropTypes.func,
      onFooterBlur: PropTypes.func,
      placeholder: PropTypes.string,
      dataLabel: PropTypes.string,
      onClick: PropTypes.func,
      ariaLabel: PropTypes.string,
      shouldVirtualKeyboardRemainOpen: PropTypes.bool,
      onReplyBoxFocusAfterReplySubmit: PropTypes.func
    },

    render() {
      const {
        value,
        disabled,
        onFooterBlur,
        className,
        placeholder,
        dataLabel,
        ariaLabel
      } = this.props;

      return (
        <TextareaAutosize
          value={value}
          className={className}
          onKeyDown={this._onReplyTextKeyDown}
          onClick={this._onClickTextArea}
          onChange={this._onReplyTextChange}
          onFocus={this._onFocusTextArea}
          onBlur={onFooterBlur}
          minRows={TEXT_AREA_MIN_ROWS}
          maxRows={TEXT_AREA_MAX_ROWS}
          onHeightChange={this._onHeightChange}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus
          ref={this._saveTextAreaRef}
          dir="auto"
          dataLabel={dataLabel}
          ariaLabel={ariaLabel}
        />
      );
    },

    /**
     * Handler for reply text area key down.
     */
    _onReplyTextKeyDown(ev) {
      if (ev.keyCode === KEY_CODES.ENTER) {
        if (!ev.shiftKey && !this.props.disableSubmit) {
          this.props.onSubmitReply();
          ev.preventDefault();
        }
      } else if (ev.keyCode === KEY_CODES.ESCAPE) {
        ev.target.blur();
      } else if (ev.keyCode === KEY_CODES.SPACE) {
        // Do not propagate the space character key down event because it is captured as a "submit"
        // action event by the parent component keydown handler.
        ev.stopPropagation();
      }
    },

    /**
     * Handler for height change of the textarea
     */
    _onHeightChange() {
      if (this.props.onHeightChange) {
        this.props.onHeightChange();
      }
    },

    /**
     * Handler for reply text area change event.
     */
    _onReplyTextChange(ev) {
      ax.setActiveIndex({
        selector: METALIST_ITEMS.CHAT.FOOTER.TEXT_AREA.SELECTOR
      });
      this.props.onChangeReplyBoxValue(ev.target.value);
    },

    /**
     * Handler for reply text area focus event
     */
    _onFocusTextArea() {
      ax.setActiveIndex({
        selector: METALIST_ITEMS.CHAT.FOOTER.TEXT_AREA.SELECTOR
      });
      this.props.onFooterFocus();
    },

    /**
     * Click handler for reply text area focus event
     */
    _onClickTextArea() {
      ax.setActiveIndex({
        selector: METALIST_ITEMS.CHAT.FOOTER.TEXT_AREA.SELECTOR
      });
    },

    /**
     * Reference of textarea
     */
    _textAreaRef: null,

    /**
     * Save textarea reference
     * @param {Object} ref - DOM reference
     */
    _saveTextAreaRef(ref) {
      this._textAreaRef = ref;
    },

    componentDidUpdate(prevProps) {
      // Focus the textarea in following cases
      // 1] When message and attachment is added
      // 2] Widget is opened
      // 3] Browser is not mobile
      const messageIsAdded = prevProps.disabled && !this.props.disabled;
      const widgetIsOpened = !prevProps.widgetIsOpened && this.props.widgetIsOpened;
      const browserIsNotMobile = !this.props.browserIsMobile;
      if ((messageIsAdded || widgetIsOpened) && browserIsNotMobile) {
        this._textAreaRef.focus();
      }

      if (this.props.shouldVirtualKeyboardRemainOpen) {
        this._textAreaRef.focus();
        this.props.onReplyBoxFocusAfterReplySubmit();
      }
    },

    componentWillUnmount() {
      // In IE 11, the reply box focus remains visible even after this component
      // unmounts resulting in a visible cursor over the other input buttons.
      // This makes the buttons of the options input un-clickable. So, we are
      // going to remove the focus from the reply box before it unmounts.
      // `this._textAreaRef` is a reference to reply box component. Reply box
      // component internally has reference to actual text area element and is
      // saved in property `ta`.
      if (objectUtils.getIn(this._textAreaRef, ["refs", "ta"])) {
        if (typeof this._textAreaRef.refs.ta.blur === "function") {
          this._textAreaRef.refs.ta.blur();
        }
      }
    }
  });
});
