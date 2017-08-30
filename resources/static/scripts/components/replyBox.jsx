/**
 * ReplyBox Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/replyBox",
  [
    "constants/keyCodes",
    "gunpowder/utils/classes",
    "gunpowder/widgets/textareaAutosize"
  ],
  function (KEY_CODES, classes, TextareaAutosize) {
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
        autoFocus: PropTypes.bool,
        onChangeReplyBoxValue: PropTypes.func.isRequired,
        onSubmitReply: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          replyBtnPlaceholder: PropTypes.string.isRequired
        }).isRequired
      },

      render () {
        const {text, disabled} = this.props;

        const replyBoxClasses = classes (
          "hs-chat-footer", {
            "hs-chat-footer--form-invalid": disabled || !this.props.value.trim ()
          }
        );

        return (
          <div className={replyBoxClasses}>
            <div className="hs-chat-footer__field">
              <TextareaAutosize value={this.props.value}
                                className="hs-chat-footer__text-area"
                                onKeyDown={this._onReplyTextKeyDown}
                                onChange={this._onReplyTextChange}
                                minRows={TEXT_AREA_MIN_ROWS}
                                maxRows={TEXT_AREA_MAX_ROWS}
                                onHeightChange={this._onReplyBoxHeightChange}
                                placeholder={text.replyBtnPlaceholder}
                                disabled={disabled}
                                autoFocus={this.props.autoFocus}
                                dir="auto" />
                <a className="hs-chat-footer__submit"
                   onClick={this._onReplyClick}>
                  <i className="ion-send" />
                </a>
            </div>
          </div>
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
      }
    });
  }
);
