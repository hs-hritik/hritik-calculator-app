/**
 * ReplyBox Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 13, 2017
 */

define ("components/containers/replyBox",
  [
    "components/replyBox",
    "actions/chatView"
  ],
  function (ReplyBox, chatViewActions) {
    "use strict";

    const mapStateToProps = (state) => {
      const {value, attachments, disabled} = state.chatView.replyBox;

      return {
        value,
        attachments,
        disabled,
        text: state.ui.text
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onChangeReplyBoxValue: (value) => {
          dispatch (chatViewActions.udpateReplyText (value));
        },
        onSubmitReply: () => {
          dispatch (chatViewActions.submitReply ());
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ReplyBox);
  }
);
