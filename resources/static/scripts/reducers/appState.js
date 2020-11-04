/**
 * App state reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define("reducers/appState", [
  "constants/actionTypes",
  "constants/activeView",
  "constants/appState",
  "gunpowder/utils/array"
], function(ACTION_TYPES, ACTIVE_VIEW, APP_STATE_CONSTANTS, arrayUtils) {
  "use strict";

  const update = React.addons.update;
  const {ISSUE_STATE, ISSUE_TYPE, APP_RESET_TRIGGER} = APP_STATE_CONSTANTS;

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
      screenSize: {width, height}
    } = config;

    return (
      height < TOTAL_WIDGET_HEIGHT ||
      width < TOTAL_WIDGET_WIDTH * VIEWABLE_WIDTH_FACTOR ||
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
    phoneNumber: "",

    // Backend flag to represent if any issue exists
    issueExists: false,
    // Issue type can take one of these three values - initial (no issue/preissue
    // has been created yet), preissue, and issue.
    issueType: ISSUE_TYPE.INITIAL,
    // Issue state can take one of these values - na (no issue/preissue
    // has been created yet), active, resolved, rejected.
    // na is for the initial issue type, other states for preissue and issue.
    issueState: ISSUE_STATE.NA,
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
      userAttachments: true,
      branding: true,
      intents: false,
      personalisedConversationIsEnabled: false
    },
    // The time after which the intents tree should be updated from the backend.
    intentsTreeSla: 0,
    // The time after which the intents model should be updated from the backend.
    intentsModelSla: 0,
    browserIsMobile: false,
    tags: [],
    cif: {},
    metadata: {},
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
      sessionId: "",
      suggestedFaqReadTracked: false
    },
    // footerIsActive is used to udpate the UI of the footer by adding a border
    // to it.
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
    windowIsFocused: false,
    keyboardInteractionIsActive: false,
    avatar: {
      showMessageFeedAvatar: false,
      agentAvatarIsPersonalised: true,
      botAvatarIsPersonalised: true,
      agentDefaultAvatarUrl: "",
      botDefaultAvatarUrl: "",
      avatarUrlTemplate: ""
    },
    showHeaderAvatar: false,
    appAvatarUrl: "",
    expiryTimestamps: {
      resolutionQuestion: 0,
      csatBot: 0
    },
    // False, when minimizes the window or switches to another tab
    parentPageIsVisible: true,
    liteSdkConfig: {},
    pfiValue: 0,
    lastConfigFetchTs: 0,
    respectPfi: true,
    isPushTokenSynced: false,
    // True, when issueExists is false in config and the issue is created
    issueExistsDataIsStaleInLocalStorage: false,
    // websocket config object containing info for setting up the connection
    wsConfig: {},
    // Idenfifier used while creating websocket connection
    hsSessionId: ""
  };

  /**
   * Convert array of arrays of attachments into linear array of attachment &
   * remove duplicate elements
   *
   * @param {Array.<string[]>} attachments- Array of array of attachments strings
   * @returns {string[]} - Array of attachments
   */
  const _processAttachmentsWhiteList = (attachments) => {
    return arrayUtils.dedupe(
      attachments.reduce((acc, attachment) => {
        return [...acc, ...attachment];
      }, [])
    );
  };

  return (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case ACTION_TYPES.REHYDRATE:
        const updateObj = {
          widgetShouldAutoOpen: {$set: !!action.data.widgetShouldAutoOpen}
        };
        updateObj.analytics = {};

        if (action.data.respectPfi === false) {
          updateObj.respectPfi = {$set: false};
        } else {
          updateObj.respectPfi = {$set: true};
        }
        if (action.data.pfiValue || action.data.pfiValue === 0) {
          updateObj.pfiValue = {$set: action.data.pfiValue};
        }
        if (action.data.lastConfigFetchTs) {
          updateObj.lastConfigFetchTs = {$set: action.data.lastConfigFetchTs};
        }
        if (action.data.issueExistsDataIsStaleInLocalStorage) {
          updateObj.issueExistsDataIsStaleInLocalStorage = {
            $set: action.data.issueExistsDataIsStaleInLocalStorage
          };
        }
        if (action.data.suggestedFaqReadTracked) {
          updateObj.analytics.suggestedFaqReadTracked = {
            $set: action.data.suggestedFaqReadTracked
          };
        }

        if (action.data.wsConfig) {
          updateObj.wsConfig = {
            $set: action.data.wsConfig
          };
        }

        return update(state, updateObj);

      case ACTION_TYPES.FETCH_CONFIG_SUCCESS:
        const {config} = action;
        const intentsAreEnabled = config.si.enabled;
        const personalisedConversationIsEnabled = config.personalised_conversation_enabled;
        const greetingFeatureEnabled = config.hasOwnProperty("greeting_enabled")
          ? config.greeting_enabled
          : true;
        const attachmentsWhitelist = _processAttachmentsWhiteList(config.wa);
        const changeObj = {
          wcEnabled: {$set: config.wm_widget_enabled},
          featuresEnabled: {
            greeting: {$set: greetingFeatureEnabled},
            resolutionQuestion: {$set: config.resolution_question_enabled},
            conversationHistory: {$set: config.conversation_history_enabled},
            userAttachments: {$set: config.allow_user_attachments},
            csatBot: {$set: config.csat_bot_enabled},
            agentNickname: {$set: config.agent_nickname_enabled},
            branding: {$set: !config.disable_helpshift_branding},
            audioNotifications: {$set: config.audio_notifications_enabled},
            intents: {$set: intentsAreEnabled},
            personalisedConversationIsEnabled: {$set: personalisedConversationIsEnabled}
          },
          issueExists: {$set: config.issue_exists},
          attachmentsWhitelist: {$set: attachmentsWhitelist},
          showHeaderAvatar: {$set: config.appearance.show_header_avatar},
          appAvatarUrl: {$set: config.appearance.app_avatar},
          browserIsMobile: {$set: action.browserIsMobile}
        };

        if (personalisedConversationIsEnabled) {
          changeObj.avatar = {
            $set: {
              showMessageFeedAvatar: config.avatar.show_feed_avatar,
              agentAvatarIsPersonalised: config.avatar.show_agent_personalised_avatar,
              botAvatarIsPersonalised: config.avatar.show_bot_personalised_avatar,
              agentDefaultAvatarUrl: config.avatar.agent_default_avatar,
              botDefaultAvatarUrl: config.avatar.bot_default_avatar,
              avatarUrlTemplate: config.avatar.avatar_template_url
            }
          };
        }

        if (intentsAreEnabled) {
          changeObj.intentsModelSla = {$set: config.si.model_sla};
          changeObj.intentsTreeSla = {$set: config.si.tree_sla};
        }

        return update(state, changeObj);

      case ACTION_TYPES.SET_APP_RESET_TRIGGER:
        return update(state, {
          appResetTrigger: {$set: action.value}
        });

      case ACTION_TYPES.SET_LANGUAGE:
        return update(state, {
          developerSetLanguage: {$set: action.language}
        });

      case ACTION_TYPES.SET_DEVICE_ID:
        return update(state, {
          deviceId: {$set: action.id}
        });

      case ACTION_TYPES.SET_ANALYTICS_SESSION_ID:
        return update(state, {
          analytics: {
            sessionId: {$set: action.id}
          }
        });

      case ACTION_TYPES.SET_ANON_USER_ID:
        return update(state, {
          anonUserIdentifier: {$set: action.id}
        });

      case ACTION_TYPES.SET_WIDGET_SHOULD_AUTO_OPEN:
        return update(state, {
          widgetShouldAutoOpen: {$set: action.widgetShouldAutoOpen}
        });

      case ACTION_TYPES.SET_RE_ENGAGEMENT_ID:
        return update(state, {
          reEngagementId: {$set: action.id}
        });

      case ACTION_TYPES.SET_WINDOW_IS_FOCUSED:
        return update(state, {
          windowIsFocused: {$set: action.windowIsFocused}
        });

      case ACTION_TYPES.SET_CLIENT_CONFIG:
        const {
          config: {
            platformId,
            language,
            domain,
            userId,
            phoneNumber,
            userName,
            userEmail,
            userAuthToken,
            tags,
            fullPrivacy,
            widgetOptions = {},
            /**
             * Internal data can be passed from helpshift config.
             * For now internal data might contain only voice meta.
             */
            __internal__ = {}
          }
        } = action;

        const fullScreen = _shouldWebChatBeFullScreen({
          screenSize: {
            width: state.parentPageInfo.width,
            height: state.parentPageInfo.height
          },
          widgetOptions
        });
        let showCloseButton = state.sdkConfigOptions.showCloseButton;
        let showLauncher = state.sdkConfigOptions.showLauncher;

        if (widgetOptions.hasOwnProperty("showCloseButton")) {
          showCloseButton = widgetOptions.showCloseButton;
        }

        if (widgetOptions.hasOwnProperty("showLauncher")) {
          showLauncher = widgetOptions.showLauncher;
        }

        return update(state, {
          platformId: {$set: platformId || ""},
          developerSetLanguage: {$set: language || ""},
          domain: {$set: domain || ""},
          userId: {$set: userId || ""},
          phoneNumber: {$set: phoneNumber || ""},
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
          showHeaderCloseButton: showLauncher
            ? {$set: showCloseButton && fullScreen}
            : {$set: showCloseButton},
          internalHsConfigData: {$set: __internal__}
        });

      case ACTION_TYPES.NEW_CONVERSATION_STARTED:
        return update(state, {
          conversationStarted: {$set: true},
          activeIssueId: {$set: ""},
          internalIssueId: {$set: ""},
          issueState: {$set: ISSUE_STATE.NA},
          issueType: {$set: ISSUE_TYPE.INITIAL},
          appResetTrigger: {$set: APP_RESET_TRIGGER.INITIAL},
          postChatFeatures: {
            resolutionQuestionCompleted: {$set: false},
            csatCompleted: {$set: false}
          }
        });

      case ACTION_TYPES.CREATE_PREISSUE_SUCCESS: {
        const {activeIssueId, internalIssueId, issueType} = action;

        return update(state, {
          conversationStarted: {$set: true},
          activeIssueId: {$set: activeIssueId},
          internalIssueId: {$set: internalIssueId},
          issueState: {$set: ISSUE_STATE.ACTIVE},
          issueType: {$set: issueType},
          sdkConfigOptions: {
            initialUserMessage: {$set: ""}
          }
        });
      }

      case ACTION_TYPES.SET_ACTIVE_ISSUE_ID:
        return update(state, {
          conversationStarted: {$set: true},
          activeIssueId: {$set: action.id}
        });

      case ACTION_TYPES.SET_INTERNAL_ISSUE_ID:
        return update(state, {
          internalIssueId: {$set: action.id}
        });

      case ACTION_TYPES.UPDATE_ACTIVE_VIEW:
        if (action.view !== state.activeView) {
          return update(state, {
            activeView: {$set: action.view}
          });
        }
        return state;

      case ACTION_TYPES.TOGGLE_MINIMIZED:
        return update(state, {
          minimized: {$set: action.minimized}
        });

      case ACTION_TYPES.UPDATE_ISSUE_TYPE:
        return update(state, {
          issueType: {$set: action.issueType}
        });

      case ACTION_TYPES.UPDATE_ISSUE_STATE:
        return update(state, {
          issueState: {$set: action.state}
        });

      case ACTION_TYPES.SET_INITIAL_USER_MESSAGE:
        return update(state, {
          sdkConfigOptions: {
            initialUserMessage: {$set: action.message}
          }
        });

      case ACTION_TYPES.SET_CONVERSATION_ENDED:
        return update(state, {
          conversationStarted: {$set: false},
          postChatFeatures: {
            resolutionQuestionCompleted: {$set: false},
            csatCompleted: {$set: false}
          }
        });

      case ACTION_TYPES.SET_CIF:
        return update(state, {
          cif: {$merge: action.cif}
        });

      case ACTION_TYPES.SET_METADATA:
        return update(state, {
          metadata: {$merge: action.metadata}
        });

      case ACTION_TYPES.REPLACE_CIF:
        return update(state, {
          cif: {$set: action.cif}
        });

      case ACTION_TYPES.SET_PARENT_PAGE_INFO:
        return update(state, {
          parentPageInfo: {$set: action.parentPageInfo}
        });

      case ACTION_TYPES.SET_PROACTIVE_CHAT_RULES:
        return update(state, {
          proactiveChatRules: {$set: action.proactiveChatRules}
        });

      case ACTION_TYPES.SET_TAGS:
        return update(state, {
          tags: {$set: action.tags}
        });

      case ACTION_TYPES.SET_SUGGESTED_FAQ_READ_TRACKED:
        return update(state, {
          analytics: {
            suggestedFaqReadTracked: {$set: action.isTracked}
          }
        });

      case ACTION_TYPES.SET_FOOTER_ACTIVE:
        return update(state, {
          footerIsActive: {$set: true}
        });

      case ACTION_TYPES.SET_CHAT_VIEW_FOOTER:
      case ACTION_TYPES.SET_FOOTER_INACTIVE:
        return update(state, {
          footerIsActive: {$set: false}
        });

      case ACTION_TYPES.SET_RESOLUTION_QUESTION_COMPLETED:
        return update(state, {
          postChatFeatures: {
            resolutionQuestionCompleted: {$set: action.completed}
          }
        });

      case ACTION_TYPES.SET_CSAT_COMPLETED:
        return update(state, {
          postChatFeatures: {
            csatCompleted: {$set: true}
          }
        });

      case ACTION_TYPES.RESET:
        // Retain the cif values set through the api
        // and appResetTrigger
        return update(INITIAL_STATE, {
          cif: {$set: state.cif},
          metadata: {$set: state.metadata},
          appResetTrigger: {$set: state.appResetTrigger},
          minimized: {$set: state.minimized},
          sdkConfigOptions: {
            initialUserMessage: {$set: state.sdkConfigOptions.initialUserMessage}
          }
        });

      case ACTION_TYPES.SET_FULL_PRIVACY:
        return update(state, {
          fullPrivacyEnabled: {$set: action.enabled}
        });

      case ACTION_TYPES.TOGGLE_ONLINE_STATUS:
        return update(state, {
          online: {$set: action.online}
        });

      case ACTION_TYPES.SET_KEYBOARD_INTERACTION_IS_ACTIVE:
        return update(state, {
          keyboardInteractionIsActive: {$set: action.active}
        });

      case ACTION_TYPES.GET_CONVERSATION_HISTORY_SUCCESS:
      case ACTION_TYPES.GET_CONVERSATION_UPDATES_SUCCESS:
        const updObj = {
          expiryTimestamps: {}
        };

        if (action.payload.resolutionQuestionExpiryTimestamp) {
          updObj.expiryTimestamps.resolutionQuestion = {
            $set: action.payload.resolutionQuestionExpiryTimestamp
          };
        }

        if (action.payload.csatBotExpiryTimestamp) {
          updObj.expiryTimestamps.csatBot = {
            $set: action.payload.csatBotExpiryTimestamp
          };
        }

        if (action.payload.hsSessionId) {
          updObj.hsSessionId = {
            $set: action.payload.hsSessionId
          };
        }

        return update(state, updObj);

      case ACTION_TYPES.USER_REPLY_REQUEST:
        const userReplyRequestUpdateObj = {
          footerIsActive: {$set: false}
        };

        // If the user replies on a re-engaged issue, reset the reEngagementId because re-engagement
        // is over with the user reply.
        if (action.reEngagementId) {
          userReplyRequestUpdateObj.reEngagementId = {$set: ""};
        }

        return update(state, userReplyRequestUpdateObj);

      case ACTION_TYPES.PARENT_PAGE_IS_VISIBLE:
        return update(state, {
          parentPageIsVisible: {$set: action.parentPageIsVisible}
        });

      case ACTION_TYPES.SET_LITE_SDK_CONFIG:
        return update(state, {
          liteSdkConfig: {
            os: {$set: action.data.os},
            metaData: {$set: action.data.metaData},
            pushToken: {$set: action.data.pushToken}
          }
        });

      case ACTION_TYPES.PUSH_TOKEN_SYNC_SUCCESS:
        return update(state, {
          isPushTokenSynced: {$set: action.payload}
        });

      case ACTION_TYPES.WS_CONFIG_SUCCESS:
        return update(state, {
          wsConfig: {$set: action.payload}
        });

      default:
        return state;
    }
  };
});
