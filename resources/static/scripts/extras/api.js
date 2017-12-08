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
    "extras/postSdkMessage",
    "actions/appState",
    "actions/chatView",
    "actions/businessHours",
    "actions/actionCreators",
    "actions/csatView",
    "components/app"
  ],
  function (store, EVENT_TYPES, APP_STATE_CONSTANTS, ACTIVE_VIEW,
    postSdkMessage, appStateActions, chatViewActions, businessHoursActions,
    actionCreators, csatViewActions, app) {
    "use strict";

    const {ISSUE_STATE, PRE_CHAT_STATE, PRE_CHAT_FEATURES} = APP_STATE_CONSTANTS;
    const ISSUE_CLOSED_STATES = [
      ISSUE_STATE.RESOLVED,
      ISSUE_STATE.REJECTED,
      ISSUE_STATE.RESOLVED_BY_FAQ_SUGGESTIONS
    ];
    const SKIP_REVIEW_COMMENTS = true;

    /**
     * Set the initial data to the app state.
     * @param {Object} data
     * @param {Object} data.clientConfig - Config set by the client with helpshiftConfig
     */
    const setConfig = (data) => {
      store.dispatch (appStateActions.setClientConfig (data.clientConfig));
      store.dispatch (appStateActions.setIdentifier (data.clientConfig.userId));
      store.dispatch (appStateActions.setWmConfig ());
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
     * Handle messenger toggle. Mount the top level React component if it's
     * not mounted already and post sdk initialized event.
     * Dispatch the action to update the messenger-minimized flag and mark messages seen.
     * @param {Boolean} minimized - If the messenger is in minimized state
     */
    const handleMessengerToggle = (minimized) => {
      store.dispatch (appStateActions.toggleMinimized (minimized));
      // If the messenger is maximized and
      // the React app is not mounted already, mount it.
      // Let the client know that the app is mounted.
      const {appState, chatView, businessHoursViewState} = store.getState ();

      if (!minimized) {
        if (!app.isMounted ()) {
          app.init ();
        }

        // If business hours enabled and currently not in business hours,
        // then show business hours view
        // Else if conversation is not started, show conversation view
        if (businessHoursViewState.businessHoursEnabled &&
            !businessHoursViewState.inBusinessHours) {
          store.dispatch (
            actionCreators.updateActiveView (ACTIVE_VIEW.BUSINESS_HOURS)
          );
        } else if (!appState.conversationStarted) {
          appStateActions.startConversation ();
        }

        // If unreadCount isn't zero and active view is chat view,
        // dispatch action to mark messages seen.
        if (chatView.unreadCount !== 0 && ACTIVE_VIEW.CHAT === appState.activeView) {
          store.dispatch (chatViewActions.markMessagesSeen ());
        }

      } else if (isIssueClosed (appState.issueState)) {
        handleCsatRatingSubmission ();
        // If minimized is true, and issue state is closed, reset the conversation.
        store.dispatch (appStateActions.reset ({
          skipUser: true
        }));
      }
    };

    /**
     * Handle intial user message
     * @param {String} message - initial user message
     */
    const handleInitialUserMsg = (message) => {
      const state = store.getState ();
      const {appState} = state;

      // If issue state is not pre chat, don't save initial message in store
      // and dont create initial user message
      if (appState.issueState !== ISSUE_STATE.PRE_CHAT) {
        return;
      }

      // Set initial user message in store
      store.dispatch (appStateActions.setInitialUserMsg (message));

      const currentPreChatFeature = appState.preChatFeatureOrder [appState.preChatFeatureIndex];
      // Create initial user message if :-
      // a] current prechat feature is "initialUserMessage"
      // b] prechat feature "initialUserMessage" is enabled (currently always enabled)
      // c] state of "initialUserMessage" is INITIAL
      if ((currentPreChatFeature === "initialUserMessage") &&
          (appState.featuresEnabled.initialUserMessage) &&
          (appState.preChatFeatureState [currentPreChatFeature] ===
           PRE_CHAT_STATE.initialUserMessage.INITIAL)) {
        store.dispatch (chatViewActions.createInitialUserMessage (message));
      }
    };

    /**
     * Dispatches appropriate action depending on the current chat view
     */
    const handleIssueCreation = () => {
      const {businessHoursViewState, appState} = store.getState ();
      const currentPreChatFeature = appState.preChatFeatureOrder [
        appState.preChatFeatureIndex
      ];

      // @TODO: Move this condition to helpers as it is required often
      if (businessHoursViewState.businessHoursEnabled &&
        !businessHoursViewState.inBusinessHours) {
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
        case EVENT_TYPES.CMD_INITIALISE:
          app.init (data);
          break;
        case EVENT_TYPES.CMD_MESSENGER_TOGGLED:
          handleMessengerToggle (data.minimized);
          break;
        case EVENT_TYPES.CMD_RESET:
          // If the reset API is called manually, reset proactive chat data as well.
          store.dispatch (appStateActions.reset ({
            resetProactiveChat: true
          }));
          break;
        case EVENT_TYPES.CMD_SET_INITIAL_USER_MESSAGE:
          handleInitialUserMsg (data.message);
          break;
        case EVENT_TYPES.CMD_SET_GREETING_MESSAGE:
          store.dispatch (actionCreators.setGreetingMsg (data.message));
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
      }
    };

    return {
      handle: handleApis
    };
  });
