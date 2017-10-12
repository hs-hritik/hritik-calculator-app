/**
 * App state reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/appState",
  [
    "constants/actionTypes",
    "constants/activeView",
    "constants/appState",
    "gunpowder/utils/object"
  ],
  function (ACTION_TYPES, ACTIVE_VIEW, APP_STATE_CONSTANTS, objUtils) {
    "use strict";

    const update = React.addons.update;
    const {ISSUE_STATE, PRE_CHAT_STATE, DEFAULT_RESET_TIMEOUT} = APP_STATE_CONSTANTS;

    const INITIAL_STATE = {
      wmEnabled: false,
      minimized: true,
      activeView: ACTIVE_VIEW.CHAT,
      activeIssueId: "",
      dummyIssueId: "DUMMY_ISSUE",
      // identifier is the uuid (Universally unique identifier)
      identifier: "",
      userProfileId: "",
      userId: "",
      platformId: "",
      domain: "",
      issueState: ISSUE_STATE.PRE_CHAT,
      featuresEnabled: {
        greeting: true,
        initialUserMessage: true,
        answerBot: false,
        infoBot: false,
        csatBot: false,
        agentNickname: false
      },
      preChatFeatureOrder: ["greeting", "initialUserMessage", "answerBot", "infoBot"],
      preChatFeatureIndex: 0,
      preChatFeatureState: {
        greeting: PRE_CHAT_STATE.greeting.INITIAL,
        initialUserMessage: PRE_CHAT_STATE.initialUserMessage.INITIAL,
        answerBot: PRE_CHAT_STATE.answerBot.INITIAL,
        infoBot: PRE_CHAT_STATE.infoBot.INITIAL
      },
      resetTimeout: DEFAULT_RESET_TIMEOUT,
      browserIsMobile: false,
      tags: [],
      cif: {},
      sdkConfigOptions: {
        fullScreen: false,
        initialUserMessage: ""
      },
      conversationStarted: false
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.REHYDRATE:
          const updateObj = {};

          if (action.data.preChatFeatureIndex) {
            updateObj.preChatFeatureIndex = {$set: action.data.preChatFeatureIndex};
          }
          if (action.data.preChatFeatureState) {
            updateObj.preChatFeatureState = {$set: action.data.preChatFeatureState};
          }
          if (action.data.issueState) {
            updateObj.issueState = {$set: action.data.issueState};
          }
          if (action.data.userProfileId) {
            updateObj.userProfileId = {$set: action.data.userProfileId};
          }

          return update (state, updateObj);

        case ACTION_TYPES.SET_WM_CONFIG:
          const {config} = action;
          const greentingFeatureEnabled = config.hasOwnProperty ("greeting_enabled") ?
                                          config.greeting_enabled : true;
          return update (state, {
            wmEnabled: {$set: config.wm_widget_enabled},
            featuresEnabled: {
              greeting: {
                $set: greentingFeatureEnabled
              },
              answerBot: {$set: config.answer_bot_enabled},
              infoBot: {$set: config.user_info_bot_enabled},
              csatBot: {$set: config.csat_bot_enabled},
              agentNickname: {$set: config.agent_nickname_enabled}
            }
          });

        case ACTION_TYPES.SET_IDENTIFIER:
          return update (state, {
            identifier: {$set: action.id}
          });

        case ACTION_TYPES.SET_CLIENT_CONFIG:
          return update (state, {
            platformId: {$set: action.config.platformId},
            domain: {$set: action.config.domain},
            userId: {$set: action.config.userId},
            resetTimeout: {$set: action.config.resetTimeout},
            tags: {$set: action.config.tags},
            sdkConfigOptions: {
              fullScreen: {
                $set: objUtils.getIn (
                  action, ["config", "widgetOptions", "fullScreen"]
                )
              }
            }
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
            preChatFeatureIndex: {$set: state.preChatFeatureIndex + 1}
          });

        case ACTION_TYPES.UPDATE_ISSUE_STATE:
          return update (state, {
            issueState: {$set: action.state}
          });

        case ACTION_TYPES.UPDATE_PRE_CHAT_FEATURE_STATE:
          return update (state, {
            preChatFeatureState: {
              [action.feature]: {
                $set: action.featureState
              }
            }
          });

        case ACTION_TYPES.SET_USER_PROFILE_ID:
          return update (state, {
            userProfileId: {$set: action.profileId}
          });

        case ACTION_TYPES.SET_MOBILE_INFO:
          return update (state, {
            browserIsMobile: {$set: action.browserIsMobile}
          });

        case ACTION_TYPES.SET_INITIAL_USER_MESSAGE:
          return update (state, {
            sdkConfigOptions: {
              initialUserMessage: {$set: action.message}
            }
          });

        case ACTION_TYPES.SET_CONVERSATION_STARTED:
          return update (state, {
            conversationStarted: {$set: true}
          });

        case ACTION_TYPES.SET_CONVERSATION_ENDED:
          return update (state, {
            conversationStarted: {$set: false}
          });

        case ACTION_TYPES.SET_CIF:
          return update (state, {
            cif: {$merge: action.cif}
          });

        case ACTION_TYPES.REPLACE_CIF:
          return update (state, {
            cif: {$set: action.cif}
          });

        default:
          return state;
      }
    };
  }
);
