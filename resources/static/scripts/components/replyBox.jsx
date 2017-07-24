/**
 * ReplyBox Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/replyBox",
  [
    "constants/keyCodes",
    "gunpowder/utils/classes"
  ],
  function (KEY_CODES, classes) {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "ReplyBox",
      propTypes: {
        /**
         * Reply textarea value.
         */
        value: PropTypes.string.isRequired,
        attachments: PropTypes.array,
        disabled: PropTypes.bool,
        onChangeReplyBoxValue: PropTypes.func.isRequired,
        onSubmitReply: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          replyBtn: PropTypes.string.isRequired,
          replyBtnPlaceholder: PropTypes.string.isRequired
        }).isRequired
      },

      render () {
        const {text, disabled} = this.props;
        // @TODO: Use store saved values for Reply button and reply placeholder.
        const btnClasses = classes ("hs-button",
                                    "hs-button--hollow",
                                    "hs-button--no-border",
                                    "hs-button--xx-small",
                                    "hs-reply-box__submit-btn");

        return (
          <div className="hs-reply-box">
            <textarea value={this.props.value}
                      className="hs-reply-box__textarea"
                      onKeyDown={this._onReplyTextKeyDown}
                      onChange={this._onReplyTextChange}
                      placeholder={text.replyBtnPlaceholder}
                      disabled={disabled}
                      autoFocus />
            <button onClick={this._onReplyClick}
                    className={btnClasses}>
              {text.replyBtn}
            </button>
          </div>
        );
      },

      /**
       * Handler for reply text area key down.
       */
      _onReplyTextKeyDown (ev) {
        if (ev.keyCode === KEY_CODES.ESCAPE) {
          ev.target.blur ();
        } if (ev.ctrlKey || ev.metaKey) {
          if (ev.keyCode === KEY_CODES.ENTER) {
            this._submitReply ();
          }
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
