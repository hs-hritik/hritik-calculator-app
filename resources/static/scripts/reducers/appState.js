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
    const {
      ISSUE_STATE,
      ISSUE_TYPE,
      APP_RESET_TRIGGER
    } = APP_STATE_CONSTANTS;

    // @NOTE -
    // 1. The meaning of edge is different for different widget positions.
    //    In case of widget position "bottom-*" the edge would be screen's bottom,
    //    whereas for position "top-*" it would be screen's top.
    //    But the value remains the same
    // 2. Normal mode = webchat with default width and height.

    // Width padding
    const HORIZONTAL_PADDING_FROM_EDGE = 28;
    // Original width of width
    const WIDGET_WIDTH = 340;
    // Total width = Original width + width padding
    const TOTAL_WIDGET_WIDTH = WIDGET_WIDTH + HORIZONTAL_PADDING_FROM_EDGE;
    // Height padding
    const VERTICAL_PADDING_FROM_EDGE = 100;
    // Minimum height of widget after resizing
    const MIN_WIDGET_HEIGHT = 320;
    // Total height = Minimum height + height padding
    const TOTAL_WIDGET_HEIGHT = MIN_WIDGET_HEIGHT + VERTICAL_PADDING_FROM_EDGE;
    // Viewable width factor is a multipler that decides how much viewable screen
    // size should be in order to display widget in normal mode.
    // Example - The screen size should be minimum 1.5 times widget width in order
    // to display widget in normal mode. If not, display full screen.
    const VIEWABLE_WIDTH_FACTOR = 1.5;

    /**
     * Predicate to return whether widget should be full screen of not
     * Full screen is computed by two ways :
     * 1. According to parent page's screen size OR
     * 2. Developer passed full screen option in widget options
     * @param {Object} config
     * @param {Object} config.widgetOptions - widget options passed by devs
     * @param {Boolean} config.widgetOptions.fullScreen - dev option for full screen
     * @param {Object} config.screenSize - screen sizes
     * @param {Number} config.screenSize.width - width of parent page
     * @param {Number} config.screenSize.height - height of parent page
     * @returns {Boolean} - whether to make widget full screen
     */
    const _shouldWebChatBeFullScreen = (config) => {
      const {
        widgetOptions,
        screenSize: {
          width,
          height
        }
      } = config;

      return (
        (height < TOTAL_WIDGET_HEIGHT || width < (TOTAL_WIDGET_WIDTH * VIEWABLE_WIDTH_FACTOR)) ||
        !!(widgetOptions && widgetOptions.fullScreen)
      );
    };

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

      // App reset triggers represent ways by which app can be reset i.e. reset
      // method will be called. The reset method can be called from multiple
      // places - preIssue reset, api, start new conversation
      appResetTrigger: APP_RESET_TRIGGER.INITIAL,
      featuresEnabled: {
        greeting: true,
        csatBot: false,
        agentNickname: false,
        resolutionQuestion: true,
        conversationHistory: true,
        userAttachments: true
      },
      browserIsMobile: false,
      tags: [],
      cif: {},
      parentPageInfo: {},
      sdkConfigOptions: {
        fullScreen: false,
        showLauncher: true,
        initialUserMessage: "",
        showCloseButton: true
      },
      showHeaderCloseButton: true,
      conversationStarted: false,
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
      online: true,
      // User re-engagement related intial values
      widgetShouldAutoOpen: false,
      reEngagementId: "",
      windowIsFocused: false
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
              conversationHistory: {$set: config.conversation_history_enabled},
              userAttachments: {$set: config.allow_user_attachments},
              csatBot: {$set: config.csat_bot_enabled},
              agentNickname: {$set: config.agent_nickname_enabled},
              audioNotifications: {$set: config.audio_notifications_enabled}
            },
            issueExists: {$set: config.issue_exists}
          });

        case ACTION_TYPES.SET_APP_RESET_TRIGGER:
          return update (state, {
            appResetTrigger: {$set: action.value}
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

        case ACTION_TYPES.SET_WIDGET_SHOULD_AUTO_OPEN:
          return update (state, {
            widgetShouldAutoOpen: {$set: action.widgetShouldAutoOpen}
          });

        case ACTION_TYPES.SET_RE_ENGAGEMENT_ID:
          return update (state, {
            reEngagementId: {$set: action.id}
          });

        case ACTION_TYPES.RESET_RE_ENGAGEMENT_ID:
          return update (state, {
            reEngagementId: {$set: ""}
          });

        case ACTION_TYPES.SET_WINDOW_IS_FOCUSED:
          return update (state, {
            windowIsFocused: {$set: action.windowIsFocused}
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
              fullPrivacy,
              widgetOptions = {}
            }
          } = action;

          const fullScreen = _shouldWebChatBeFullScreen ({
            screenSize: {
              width: state.parentPageInfo.width,
              height: state.parentPageInfo.height
            },
            widgetOptions
          });
          let showCloseButton = state.sdkConfigOptions.showCloseButton;
          let showLauncher = state.sdkConfigOptions.showLauncher;

          if (widgetOptions.hasOwnProperty ("showCloseButton")) {
            showCloseButton = widgetOptions.showCloseButton;
          }

          if (widgetOptions.hasOwnProperty ("showLauncher")) {
            showLauncher = widgetOptions.showLauncher;
          }

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
              fullScreen: {$set: fullScreen},
              showCloseButton: {$set: showCloseButton},
              showLauncher: {$set: showLauncher}
            },
            // We need to show header close button in following cases
            // 1] showLauncher = true && fullScreen = true && showCloseButton = true
            //    OR
            // 2] showLauncher = false && showCloseButton = true
            // @NOTE - These are optimized conditions. For more info refer SPA
            // config options doc :- https://tinyurl.com/yafecdkv
            showHeaderCloseButton: showLauncher ? {$set: showCloseButton && fullScreen} :
                                   {$set: showCloseButton}
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

        case ACTION_TYPES.SET_PARENT_PAGE_INFO:
          return update (state, {
            parentPageInfo: {$set: action.parentPageInfo}
          });

        case ACTION_TYPES.SET_PROACTIVE_CHAT_RULES:
          return update (state, {
            proactiveChatRules: {$set: action.proactiveChatRules}
          });

        case ACTION_TYPES.SET_TAGS:
          return update (state, {
            tags: {$set: action.tags}
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
          // and appResetTrigger
          return update (INITIAL_STATE, {
            cif: {$set: state.cif},
            appResetTrigger: {$set: state.appResetTrigger},
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
