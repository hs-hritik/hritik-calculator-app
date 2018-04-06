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
    "helpers/common"
  ],
  function (ReplyBox, chatViewActions, appStateActions, commonHelpers) {
    "use strict";

    const mapStateToProps = (state) => {
      const {
        chatView: {
          userInput: {
            value,
            disabled
          }
        },
        appState: {
          minimized,
          activeIssueId,
          browserIsMobile,
          issueType
        },
        ui: {
          text
        }
      } = state;

      return {
        value,
        disabled,
        widgetIsOpened: !minimized,
        text,
        issueIsCreated: commonHelpers.isIssueCreated ({
          activeIssueId,
          issueType
        }),
        browserIsMobile
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
