/**
 * ReplyBox Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 13, 2017
 */

define("components/containers/replyBox", [
  "components/replyBox",
  "actions/chatView",
  "actions/actionCreators",
  "helpers/common"
], function(ReplyBox, chatViewActions, actionCreators, commonHelpers) {
  "use strict";

  const mapStateToProps = (state) => {
    const {
      chatView: {
        userInput: {value, disabled, placeholder: userInputPlaceholder}
      },
      appState: {minimized, activeIssueId, browserIsMobile, issueType},
      ui: {text}
    } = state;

    // @TODO: Intents: Pass intentsReplyBoxPlaceholder/intentsReplyBoxPlaceholderEis
    // as placeholder when intents are shown to the user.
    return {
      value,
      disabled,
      placeholder: userInputPlaceholder || text.replyBtnPlaceholder,
      widgetIsOpened: !minimized,
      text,
      issueIsCreated: commonHelpers.isIssueCreated({
        activeIssueId,
        issueType
      }),
      browserIsMobile
    };
  };

  const mapDispatchToProps = (dispatch) => {
    return {
      onChangeReplyBoxValue: (value) => {
        dispatch(chatViewActions.updateReplyTextAndSearchIntents(value));
      },
      onSubmitReply: () => {
        dispatch(chatViewActions.submitReply());
      },
      onFooterFocus: () => {
        dispatch(actionCreators.setFooterActive());
      },
      onFooterBlur: () => {
        dispatch(actionCreators.setFooterInactive());
      }
    };
  };

  return ReactRedux.connect(mapStateToProps, mapDispatchToProps)(ReplyBox);
});
