/**
 * ReplyBox Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 13, 2017
 */

define ("components/containers/replyBox",
  [
    "components/replyBox",
    "actions/chatView",
    "actions/appState",
    "constants/chatView"
  ],
  function (ReplyBox, chatViewActions, appStateActions, chatViewConstants) {
    "use strict";

    const {ACTIVE_FOOTER} = chatViewConstants;

    const mapStateToProps = (state) => {
      const {chatView: chatViewState, appState, ui} = state;
      const {value, disabled} = chatViewState.replyBox;
      let replyBoxHeading = null;

      if (chatViewState.activeFooter === ACTIVE_FOOTER.SOLUTION_REJECTED) {
        replyBoxHeading = ui.text.chatViewIssueRejectionQuestion;
      }

      return {
        value,
        disabled,
        widgetIsOpened: !appState.minimized,
        text: ui.text,
        issueIsCreated: !!appState.activeIssueId,
        browserIsMobile: appState.browserIsMobile,
        replyBoxHeading
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
        },
        onFooterFocus: () => {
          dispatch (appStateActions.setFooterActive ());
        },
        onFooterBlur: () => {
          dispatch (appStateActions.setFooterInactive ());
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ReplyBox);
  }
);
