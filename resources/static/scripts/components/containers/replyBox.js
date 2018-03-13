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
      const {value, disabled} = chatViewState.userInput;
      let replyBoxHeading = null;

      // We are treating passing heading to replyBox as rare case, currently only
      // applicable for question when resolution rejected by user.
      // We have different layout for displaying a. heading b. input c. error
      // In almost every case we will use above layout
      // More info :- Check chatViewFooter component
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
          dispatch (chatViewActions.updateReplyText (value));
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
