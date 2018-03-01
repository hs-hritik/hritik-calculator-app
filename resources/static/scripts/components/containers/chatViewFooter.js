/**
 * ChatViewFooter Container.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Feb 28, 2017
 */

define ("components/containers/chatViewFooter",
  [
    "components/chatViewFooter",
    "actions/chatView",
    "actions/actionCreators",
    "actions/appState",
    "actions/csatView",
    "constants/activeView",
    "constants/chatView"
  ],
  function (ChatViewFooter, chatViewActions, actionCreators, appStateActions,
    csatViewActions, ACTIVE_VIEW) {
    "use strict";

    const mapStateToProps = (state) => {
      const {
        chatView: {
          infoBot
        },
        csatView: {
          rating
        }
      } = state;

      return {
        rating,
        activeFooter: state.chatView.activeFooter,
        infoBotField: infoBot.data [infoBot.currentField],
        text: state.ui.text,
        footerIsActive: state.appState.footerIsActive
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
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
        onStarClick: (updatedRating) => {
          dispatch (csatViewActions.updateCsatRating (updatedRating));
          dispatch (actionCreators.updateActiveView (ACTIVE_VIEW.CSAT));
        },
        onFooterFocus: () => {
          dispatch (appStateActions.setFooterActive ());
        },
        onFooterBlur: () => {
          dispatch (appStateActions.setFooterInactive ());
        },
        onAcceptResolutionQuestionClick: () => {
          dispatch (chatViewActions.acceptResolutionQuestion ());
        },
        onRejectResolutionQuestionClick: () => {
          dispatch (chatViewActions.rejectResolutionQuestion ());
        },
        onStartNewConversation: () => {
          dispatch (appStateActions.reset ());
          appStateActions.startConversation ();
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (ChatViewFooter);
  }
);
