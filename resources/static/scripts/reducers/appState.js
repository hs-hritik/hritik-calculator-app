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
    const {
      ISSUE_STATE,
      ISSUE_TYPE
    } = APP_STATE_CONSTANTS;

    const INITIAL_STATE = {
      wcEnabled: false,
      minimized: true,
      activeView: ACTIVE_VIEW.CHAT,
      platformId: "",
      domain: "",
      // preferred language set by the developer
      developerSetLanguage: "",

      // Profile related data
      deviceId: "",
      // User id values
      // 1. anonUserIdentifier (created for anon user / default profile)
      // 2. userId (passed with helpshiftConfig)
      anonUserIdentifier: "",
      userId: "",
      userName: "",
      userEmail: "",
      userAuthToken: "",

      // Backend flag to represent if any issue exists
      issueExists: false,
      // Type of issue can either be a. issue b. preissue
      issueType: ISSUE_TYPE.PRE_ISSUE,
      // Issue state can be either a. active b. resolved c. rejected
      // It's applicable for both issue types (issue and preissue)
      issueState: ISSUE_STATE.ACTIVE,
      activeIssueId: "",
      internalIssueId: "",

      // Used to start a new conversation when user clicks on start new conversation
      // The value is not set to default on 'reset', rather retained throughout the
      // application.
      // Only on page refresh, the value will be false and when we initialize the
      // conversation, we set it to true.
      webChatIsLive: false,
      featuresEnabled: {
        greeting: true,
        csatBot: false,
        agentNickname: false,
        resolutionQuestion: true
      },
      browserIsMobile: false,
      tags: [],
      cif: {},
      metadata: {},
      sdkConfigOptions: {
        fullScreen: false,
        initialUserMessage: ""
      },
      conversationStarted: false,
      parentPageInfo: {
        title: "",
        url: ""
      },
      proactiveChatRules: [],
      analytics: {
        suggestedFaqReadTracked: false
      },
      footerIsActive: false,
      postChatFeatures: {
        resolutionQuestionCompleted: false,
        csatCompleted: false
      },
      fullPrivacyEnabled: false,
      online: true
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.REHYDRATE:
          const updateObj = {};
          updateObj.analytics = {};

          if (action.data.suggestedFaqReadTracked) {
            updateObj.analytics.suggestedFaqReadTracked = {
              $set: action.data.suggestedFaqReadTracked
            };
          }

          return update (state, updateObj);

        case ACTION_TYPES.SET_WM_CONFIG:
          const {config} = action;
          const greentingFeatureEnabled = config.hasOwnProperty ("greeting_enabled") ?
                                          config.greeting_enabled : true;
          return update (state, {
            wcEnabled: {$set: config.wm_widget_enabled},
            featuresEnabled: {
              greeting: {$set: greentingFeatureEnabled},
              resolutionQuestion: {$set: config.resolution_question_enabled},
              csatBot: {$set: config.csat_bot_enabled},
              agentNickname: {$set: config.agent_nickname_enabled},
              audioNotifications: {$set: config.audio_notifications_enabled}
            },
            issueExists: {$set: config.issue_exists}
          });

        case ACTION_TYPES.SET_WEB_CHAT_IS_LIVE:
          return update (state, {
            webChatIsLive: {$set: true}
          });

        case ACTION_TYPES.SET_LANGUAGE:
          return update (state, {
            developerSetLanguage: {$set: action.language}
          });

        case ACTION_TYPES.SET_DEVICE_ID:
          return update (state, {
            deviceId: {$set: action.id}
          });

        case ACTION_TYPES.SET_ANON_USER_ID:
          return update (state, {
            anonUserIdentifier: {$set: action.id}
          });

        case ACTION_TYPES.SET_CLIENT_CONFIG:
          const {
            config: {
              platformId,
              language,
              domain,
              userId,
              userName,
              userEmail,
              userAuthToken,
              tags,
              fullPrivacy
            }
          } = action;

          return update (state, {
            platformId: {$set: platformId || ""},
            developerSetLanguage: {$set: language || ""},
            domain: {$set: domain || ""},
            userId: {$set: userId || ""},
            userName: {$set: userName || ""},
            userEmail: {$set: userEmail || ""},
            userAuthToken: {$set: userAuthToken || ""},
            tags: {$set: tags || []},
            fullPrivacyEnabled: {$set: fullPrivacy || false},
            sdkConfigOptions: {
              fullScreen: {
                $set: objUtils.getIn (
                  action, ["config", "widgetOptions", "fullScreen"]
                ) || false
              }
            }
          });

        case ACTION_TYPES.SET_ACTIVE_ISSUE_ID:
          return update (state, {
            activeIssueId: {$set: action.id}
          });

        case ACTION_TYPES.SET_INTERNAL_ISSUE_ID:
          return update (state, {
            internalIssueId: {$set: action.id}
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

        case ACTION_TYPES.UPDATE_ISSUE_TYPE:
          return update (state, {
            issueType: {$set: action.issueType}
          });

        case ACTION_TYPES.UPDATE_ISSUE_STATE:
          return update (state, {
            issueState: {$set: action.state}
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
            conversationStarted: {$set: false},
            postChatFeatures: {
              resolutionQuestionCompleted: {$set: false},
              csatCompleted: {$set: false}
            }
          });

        case ACTION_TYPES.SET_CIF:
          return update (state, {
            cif: {$merge: action.cif}
          });

        case ACTION_TYPES.REPLACE_CIF:
          return update (state, {
            cif: {$set: action.cif}
          });

        case ACTION_TYPES.SET_METADATA:
          return update (state, {
            metadata: {$set: action.metadata}
          });

        case ACTION_TYPES.SET_PROACTIVE_CHAT_RULES:
          return update (state, {
            proactiveChatRules: {$set: action.proactiveChatRules}
          });

        case ACTION_TYPES.SET_TAGS:
          return update (state, {
            tags: {$set: action.tags}
          });

        case ACTION_TYPES.SET_PARENT_PAGE_INFO:
          return update (state, {
            parentPageInfo: {
              title: {$set: action.parentPageInfo.title},
              url: {$set: action.parentPageInfo.url}
            }
          });

        case ACTION_TYPES.SET_SUGGESTED_FAQ_READ_TRACKED:
          return update (state, {
            analytics: {
              suggestedFaqReadTracked: {$set: action.isTracked}
            }
          });

        case ACTION_TYPES.SET_FOOTER_ACTIVE:
          return update (state, {
            footerIsActive: {$set: true}
          });

        case ACTION_TYPES.SET_CHAT_VIEW_FOOTER:
        case ACTION_TYPES.SET_FOOTER_INACTIVE:
          return update (state, {
            footerIsActive: {$set: false}
          });

        case ACTION_TYPES.SET_RESOLUTION_QUESTION_COMPLETED:
          return update (state, {
            postChatFeatures: {
              resolutionQuestionCompleted: {$set: action.completed}
            }
          });

        case ACTION_TYPES.SET_CSAT_COMPLETED:
          return update (state, {
            postChatFeatures: {
              csatCompleted: {$set: true}
            }
          });

        case ACTION_TYPES.RESET:
          // Retain the cif values set through the api
          // and webChatIsLive flag
          return update (INITIAL_STATE, {
            cif: {$set: state.cif},
            webChatIsLive: {$set: state.webChatIsLive},
            minimized: {$set: state.minimized}
          });

        case ACTION_TYPES.SET_FULL_PRIVACY:
          return update (state, {
            fullPrivacyEnabled: {$set: action.enabled}
          });

        case ACTION_TYPES.TOGGLE_ONLINE_STATUS:
          return update (state, {
            online: {$set: action.online}
          });

        default:
          return state;
      }
    };
  }
);
