/**
 * App state reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/appState",
  [
    "constants/actionTypes",
    "constants/activeView",
    "constants/appState"
  ],
  function (ACTION_TYPES, ACTIVE_VIEW, APP_STATE_CONSTANTS) {
    "use strict";

    const update = React.addons.update;
    const {ISSUE_STATE} = APP_STATE_CONSTANTS;

    const INITIAL_STATE = {
      minimized: true,
      activeView: ACTIVE_VIEW.CHAT,
      activeIssueId: "",
      dummyIssueId: "DUMMY_ISSUE",
      currentUserId: "",
      platformId: "",
      profileId: "",
      apiToken: "",
      domain: "",
      appId: "",
      issueState: ISSUE_STATE.PRE_CHAT,
      featuresEnabled: {
        greeting: true,
        answerBot: true,
        getInfoBot: true,
        csat: true
      },
      preChatfeaturesOrder: ["greeting", "answerBot", "getInfoBot"],
      preChatfeatureIndex: 0,
      // @TODO: Update this based on the updated structure of the state
      // that has featuresEnabled, etc. Also, move the text values to the ui
      // reducer.
      wmConfig: {
        widgetEnabled: false,
        agentNicknameEnabled: false,
        ansBotEnabled: false,
        userInfoBotEnabled: false,
        csatBotEnbaled: false,
        greetingMsg: "Hi! How can I help you today?",
        appearance: {
          widgetTitle: "Chat with us",
          primaryColor: "#43BF6C"
        },
        userInfoBot: {
          selection: ["name"]
        },
        csatBot: {
          requestMsg: "Thanks! Would you like to fill this?",
          formMsg: "Your feedback helps us improve"
        }
      }
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.SET_WM_CONFIG:
          return update (state, {
            wmConfig: {$set: action.config}
          });

        case ACTION_TYPES.SET_USER_ID:
          return update (state, {
            currentUserId: {$set: action.id}
          });

        case ACTION_TYPES.SET_CLIENT_CONFIG:
          return update (state, {
            platformId: {$set: action.config.platformId},
            apiToken: {$set: action.config.apiToken},
            domain: {$set: action.config.domain},
            profileId: {$set: action.config.profileId},
            appId: {$set: action.config.appId}
          });

        case ACTION_TYPES.SET_ACTIVE_ISSUE:
          return update (state, {
            activeIssueId: {$set: action.id}
          });

        case ACTION_TYPES.UPDATE_ACTIVE_VIEW:
          if (action.view !== state.activeView) {
            return update (state, {
              activeView: {$set: action.view}
            });
          }
          return state;

        case ACTION_TYPES.TOGGLE_MINIMIZED:
          return update (state, {
            minimized: {$set: action.minimized}
          });

        case ACTION_TYPES.INCREMENT_PRE_CHAT_FEATURE_INDEX:
          return update (state, {
            preChatfeatureIndex: {$set: state.preChatfeatureIndex + 1}
          });

        default:
          return state;
      }
    };
  }
);
