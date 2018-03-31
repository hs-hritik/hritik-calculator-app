/**
 * Helpshift API handler.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("extras/api",
  [
    "store",
    "constants/eventTypes",
    "constants/appState",
    "constants/activeView",
    "constants/analytics",
    "extras/postSdkMessage",
    "actions/appState",
    "actions/chatView",
    "actions/businessHours",
    "actions/actionCreators",
    "actions/csatView",
    "actions/ui",
    "components/app",
    "helpers/analytics",
    "helpers/common"
  ],
  function (store, EVENT_TYPES, APP_STATE_CONSTANTS, ACTIVE_VIEW, analyticsConstants,
    postSdkMessage, appStateActions, chatViewActions, businessHoursActions,
    actionCreators, csatViewActions, uiActions, app, analyticsHelpers, commonHelpers) {
    "use strict";

    const {ISSUE_STATE, PRE_CHAT_FEATURES} = APP_STATE_CONSTANTS;
    const ISSUE_CLOSED_STATES = [
      ISSUE_STATE.RESOLVED,
      ISSUE_STATE.REJECTED,
      ISSUE_STATE.RESOLVED_BY_FAQ_SUGGESTIONS
    ];
    const SKIP_REVIEW_COMMENTS = true;

    const {EVENT} = analyticsConstants;

    /**
     * Set the initial data to the app state.
     * @param {Object} data
     * @param {Object} data.clientConfig - Config set by the client with helpshiftConfig
     * @param {string} data.trigger - The source that triggered setting the config
     */
    const setConfig = (data) => {
      store.dispatch (appStateActions.setClientConfig (data.clientConfig));
      store.dispatch (appStateActions.setDeviceId ());
      store.dispatch (appStateActions.setAnonUserId (data.clientConfig.userId));
      store.dispatch (appStateActions.setWmConfig ({
        trigger: data.trigger,
        helpshiftConfig: data.clientConfig
      }));
    };

    /**
     * Check if given issue state is closed state or not.
     * @param {String} issueState
     * @returns {Boolean} - true if issue state is closed.
     */
    const isIssueClosed = (issueState) => {
      return ISSUE_CLOSED_STATES.indexOf (issueState) !== -1;
    };

    /**
     * Handle CSAT rating submission
     */
    const handleCsatRatingSubmission = () => {
      // If current view is CSAT view and user has not submitted the rating,
      // submit the rating on minimize
      const {appState, csatView} = store.getState ();
      if (appState.activeView === ACTIVE_VIEW.CSAT && !csatView.completed) {
        store.dispatch (csatViewActions.submitCsat (SKIP_REVIEW_COMMENTS));
      }
    };

    /**
     * Handle web chat toggle. Mount the top level React component if it's
     * not mounted already and post sdk initialized event.
     * Dispatch the action to update the messenger-minimized flag and mark messages seen.
     * @param {Object} config
     * @param {boolean} config.minimized - If the web chat widget is in minimized state.
     * @param {boolean} [config.trigger] - Source that triggered the function
     *    call - user action, api, etc.
     */
    const handleMessengerToggle = ({minimized, trigger}) => {
      store.dispatch (appStateActions.toggleMinimized (minimized));
      // If the messenger is maximized and
      // the React app is not mounted already, mount it.
      // Let the client know that the app is mounted.
      const {
        appState: {
          activeView,
          conversationStarted,
          issueState
        },
        chatView: {
          unreadCount
        }
      } = store.getState ();

      if (!minimized) {
        if (!app.isMounted ()) {
          app.init ();
        }

        // If unreadCount isn't zero and active view is chat view,
        // dispatch action to mark messages seen.
        if (unreadCount !== 0 && ACTIVE_VIEW.CHAT === activeView) {
          store.dispatch (chatViewActions.markMessagesSeen ());
        }

        // When the end user opens the widget, check if preIssue reset
        // is applicable and if so, handle it.
        store.dispatch (appStateActions.handlePreIssueReset ());

        // Start the conversation when the widget is opened.
        if (!conversationStarted) {
          store.dispatch (appStateActions.startConversation ());
        }

        // Track the widget open event
        analyticsHelpers.track (EVENT.WIDGET_OPEN, {
          trigger
        });
      } else if (isIssueClosed (issueState)) {
        // @TODO : Change this default rating submission after confirming with product
        handleCsatRatingSubmission ();
      }
    };

    /**
     * Handle intial user message
     * @param {Object} [config]
     * @param {string} [config.message] - Initial user message.
     * @param {string} [config.trigger] - Source that triggered the function
     *    call - user action, api, etc.
     */
    const handleInitialUserMsg = ({message, trigger}) => {
      // Set initial user message in store
      store.dispatch (appStateActions.setInitialUserMsg (message));

      // @TODO - Find a place to call get parent info, as createInitialUserMessage
      // was internally calling the same.
      // @TODO - Verify if this is the right place to track conversation start event

      // Track the conversation started event.
      // Pass trigger as "API" because this is the handler function for
      // the setInitialUserMessage API.
      analyticsHelpers.track (EVENT.CONVERSATION_STARTED, {
        trigger
      });
    };

    /**
     * Dispatches appropriate action depending on the current chat view
     */
    const handleIssueCreation = () => {
      const {appState} = store.getState ();
      const currentPreChatFeature = appState.preChatFeatureOrder [
        appState.preChatFeatureIndex
      ];

      if (commonHelpers.isOutOfBusinessHours ()) {
        store.dispatch (businessHoursActions.registerUserAndCreateIssue ());
      } else if (currentPreChatFeature === PRE_CHAT_FEATURES.INITIAL_USER_MESSAGE) {
        store.dispatch (chatViewActions.startNextPreChatFeature ());
      }
    };

    const handleApis = (type, data) => {
      switch (type) {
        case EVENT_TYPES.CMD_SET_CONFIG:
          setConfig (data);
          break;
        case EVENT_TYPES.CMD_MESSENGER_TOGGLED:
          handleMessengerToggle (data);
          break;
        case EVENT_TYPES.CMD_RESET:
          // If the reset API is called manually, reset proactive chat data as well.
          store.dispatch (appStateActions.reset ({
            resetProactiveChat: true
          }));
          break;
        case EVENT_TYPES.CMD_SET_INITIAL_USER_MESSAGE:
          handleInitialUserMsg (data);
          break;
        case EVENT_TYPES.CMD_SET_GREETING_MESSAGE:
          store.dispatch (actionCreators.setGreetingMsg (data.message));
          break;
        case EVENT_TYPES.CMD_SET_LANGUAGE:
          store.dispatch (actionCreators.setLanguage (data.language));
          break;
        case EVENT_TYPES.CMD_SET_CIF:
          store.dispatch (actionCreators.setCif (data.cifData));
          break;
        case EVENT_TYPES.CMD_REPLACE_CIF:
          store.dispatch (appStateActions.replaceCif (data.cifData));
          break;
        case EVENT_TYPES.CMD_SET_PARENT_PAGE_INFO:
          // This is actual effect of event
          store.dispatch (appStateActions.setMetadata (data));
          // This is side effect of event.
          // @TODO: Handle such side effects at more appropriate place.
          handleIssueCreation ();
          break;
        case EVENT_TYPES.CMD_SET_EXEC_PROACTIVE_CHAT_RULES:
          if (data.parentPageInfo) {
            store.dispatch (appStateActions.setParentPageInfo (data.parentPageInfo));
          }
          store.dispatch (appStateActions.setProactiveChatRules (data.proactiveChatRules));
          store.dispatch (appStateActions.executeProactiveChatRules (data));
          break;
        case EVENT_TYPES.CMD_UPDATE_UI_CONFIG:
          store.dispatch (uiActions.updateUiConfig (data.uiConfig));
          store.dispatch (uiActions.setDeveloperUiConfig (data.uiConfig));
          store.dispatch (appStateActions.updateStyles ());
      }
    };

    return {
      handle: handleApis
    };
  });
