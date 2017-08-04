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
      wmEnabled: false,
      minimized: true,
      activeView: ACTIVE_VIEW.CHAT,
      activeIssueId: "",
      dummyIssueId: "DUMMY_ISSUE",
      identifier: "",
      userId: "",
      uuid: "",
      // @TODO: Check if currentUserId is really required.
      currentUserId: "",
      platformId: "",
      profileId: "",
      apiToken: "",
      domain: "",
      appId: "",
      issueState: ISSUE_STATE.PRE_CHAT,
      featuresEnabled: {
        greeting: true,
        answerBot: false,
        infoBot: false,
        csatBot: false,
        agentNickname: false
      },
      preChatfeaturesOrder: ["greeting", "answerBot", "infoBot"],
      preChatfeatureIndex: 0
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.SET_WM_CONFIG:
          const {config} = action;

          return update (state, {
            wmEnabled: {$set: config.widget_enabled},
            featuresEnabled: {
              answerBot: {$set: config.answer_bot_enabled},
              infoBot: {$set: config.info_bot_enabled},
              csatBot: {$set: config.csat_bot_enabled},
              agentNickname: {$set: config.agent_nickname_enabled}
            }
          });

        case ACTION_TYPES.SET_UUID:
          return update (state, {
            uuid: {$set: action.id}
          });

        case ACTION_TYPES.SET_USER_ID:
          return update (state, {
            identifier: {$set: action.id}
          });

        case ACTION_TYPES.SET_CLIENT_CONFIG:
          return update (state, {
            platformId: {$set: action.config.platformId},
            apiToken: {$set: action.config.apiToken},
            domain: {$set: action.config.domain},
            profileId: {$set: action.config.profileId},
            appId: {$set: action.config.appId},
            userId: {$set: action.config.userId}
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
