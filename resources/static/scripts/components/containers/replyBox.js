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
      const {value, disabled} = state.chatView.replyBox;

      return {
        value,
        disabled,
        widgetIsOpened: !state.appState.minimized,
        text: state.ui.text,
        issueIsCreated: !!state.appState.activeIssueId,
        browserIsMobile: state.appState.browserIsMobile
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onChangeReplyBoxValue: (value) => {
          dispatch (chatViewActions.udpateReplyText (value));
        },
        onSubmitReply: () => {
          dispatch (chatViewActions.submitReply ());
        },
        onFilesChange: (files) => {
          dispatch (chatViewActions.createAttachmentMessages (files));
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ReplyBox);
  }
);
