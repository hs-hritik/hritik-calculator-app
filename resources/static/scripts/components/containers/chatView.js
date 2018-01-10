/**
 * ChatView Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/containers/chatView",
  [
    "normalizr",
    "components/chatView",
    "helpers/entitySchema",
    "actions/chatView",
    "actions/faqView",
    "actions/actionCreators",
    "actions/appState",
    "actions/csatView",
    "constants/activeView"
  ],
  function (normalizr, ChatView, entitySchema, chatViewActions, faqViewActions,
    actionCreators, appStateActions, csatViewActions, ACTIVE_VIEW) {
    "use strict";

    const {denormalize} = normalizr;

    const mapStateToProps = (state) => {
      const issueId = state.appState.activeIssueId || state.appState.dummyIssueId;
      const issue = denormalize (issueId, entitySchema.issue, state.entities);
      const messages = issue ? issue.messages : [];
      const {infoBot} = state.chatView;
      const {rating} = state.csatView;

      return {
        messages,
        rating,
        activeFooter: state.chatView.activeFooter,
        isTyping: state.chatView.systemTyping || state.chatView.agentTyping,
        infoBotField: infoBot.data [infoBot.currentField],
        showAgentNickname: state.appState.featuresEnabled.agentNickname,
        text: state.ui.text,
        issueIsCreated: !!state.appState.activeIssueId,
        footerIsActive: state.appState.footerIsActive
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onSuggestedFaqClick: (faqId) => {
          dispatch (faqViewActions.getFaq (faqId));
        },
        onFaqSuggestionFeedback: (feedbackHelpful) => {
          if (feedbackHelpful) {
            dispatch (chatViewActions.acceptFaqSuggestions ());
          } else {
            dispatch (chatViewActions.rejectFaqSuggestions ());
          }
        },
        onValueChangeInfoBotField: (value) => {
          dispatch (chatViewActions.updateInfoBotFieldValue ({
            value,
            errorMsg: ""
          }));
        },
        onSubmitInfoBotField: () => {
          dispatch (chatViewActions.submitInfoBotField ());
        },
        onCloseConversation: () => {
          dispatch (appStateActions.closeConversation ());
        },
        onStartCsatSurveyClick: () => {
          dispatch (actionCreators.updateActiveView (ACTIVE_VIEW.CSAT));
        },
        onFilesDrop: (files) => {
          dispatch (chatViewActions.createAttachmentMessages (files));
        },
        onRetryAttachmentClick: (message) => {
          dispatch (
            chatViewActions.createAttachmentMessage (message.file, message.id)
          );
        },
        onStarClick: (updatedRating) => {
          dispatch (csatViewActions.updateCsatRating (updatedRating));
          dispatch (actionCreators.updateActiveView (ACTIVE_VIEW.CSAT));
        },
        onFooterFocus: () => {
          dispatch (appStateActions.setFooterActive ());
        },
        onFooterBlur: () => {
          dispatch (appStateActions.setFooterInactive ());
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatView);
  }
);
