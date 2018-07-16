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
    "actions/appState",
    "actions/chatView",
    "actions/actionCreators",
    "actions/csatView",
    "actions/ui",
    "components/app",
    "helpers/analytics",
    "helpers/localStorage",
    "gunpowder/utils/localStorage"
  ],
  function (store, EVENT_TYPES, APP_STATE_CONSTANTS, ACTIVE_VIEW, analyticsConstants,
    appStateActions, chatViewActions, actionCreators, csatViewActions, uiActions,
    app, analyticsHelpers, lsHelpers, lsUtils) {
    "use strict";

    const {
      ISSUE_STATE,
      ISSUE_TYPE,
      PRE_ISSUE_RESET_TIMEOUT
    } = APP_STATE_CONSTANTS;

    const ISSUE_CLOSED_STATES = [
      ISSUE_STATE.RESOLVED,
      ISSUE_STATE.REJECTED,
      ISSUE_STATE.RESOLVED_BY_FAQ_SUGGESTIONS
    ];
    const SKIP_REVIEW_COMMENTS = true;

    const {EVENT} = analyticsConstants;

    /**
     * Check if preIssue reset is applicable.
     * PreIssue should reset if
     *  the issue type is `preIssue` and
     *  its state is `active` i.e. it's not resolved
     *  the time elapsed since the last activity is > 24h
     * @returns {boolean}
     */
    const _shouldPreIssueReset = () => {
      const {
        appState: {
          activeIssueId,
          issueType,
          issueState
        }
      } = store.getState ();

      const lastActivityTime = lsHelpers.getLastActivityTime ();
      const inactivityDuration = Date.now () - lastActivityTime;

      return (
        !!lastActivityTime &&
        !!activeIssueId &&
        issueType === ISSUE_TYPE.PRE_ISSUE &&
        issueState === ISSUE_STATE.ACTIVE &&
        inactivityDuration > PRE_ISSUE_RESET_TIMEOUT
      );
    };

    /**
     * Set the initial data to the app state.
     * @param {Object} data
     * @param {Object} data.clientConfig - Config set by the client with helpshiftConfig
     * @param {Object} data.parentPageInfo - Data (title, body) of the client website
     * @param {string} data.trigger - The source that triggered setting the config
     * @param {string} data.lsDataToMigrate - localStorage data from the old iframe to be migrated
     */
    const setConfig = (data) => {
      const {
        clientConfig,
        parentPageInfo,
        trigger,
        lsDataToMigrate
      } = data;

      // Set localStorage data to be migrated to web chat's localStorage
      // Set data in the localStorage only if it hasn't happened yet.
      if (!lsHelpers.getLsMigrated () && (lsDataToMigrate && typeof lsDataToMigrate === "object")) {
        for (const lsKey in lsDataToMigrate) {
          if (lsDataToMigrate.hasOwnProperty (lsKey)) {
            lsUtils.setItem (lsKey, lsDataToMigrate [lsKey]);
          }
        }

        // Set a flag in the localStorage denoting the migration.
        lsHelpers.setLsMigrated ();
      }

      store.dispatch (appStateActions.setClientConfig (clientConfig));
      store.dispatch (appStateActions.setMetadata (parentPageInfo));
      store.dispatch (appStateActions.setDeviceId ());
      store.dispatch (appStateActions.setAnonUserId (clientConfig.userId));
      store.dispatch (appStateActions.setWmConfig ({
        trigger: trigger,
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
        // is applicable and if so, handle it. Else, start a conversation, if it
        // hasn't started yet.
        if (_shouldPreIssueReset ()) {
          store.dispatch (appStateActions.resetPreIssue ());
        } else if (!conversationStarted) {
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
     */
    const handleInitialUserMsg = ({message}) => {
      // Set initial user message in store
      store.dispatch (appStateActions.setInitialUserMsg (message));
    };

    const handleApis = (type, data) => {
      switch (type) {
        case EVENT_TYPES.CMD_SET_CONFIG:
          setConfig (data);
          break;
        case EVENT_TYPES.CMD_MESSENGER_TOGGLED:
          handleMessengerToggle (data);
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
        case EVENT_TYPES.CMD_SET_EXEC_PROACTIVE_CHAT_RULES:
          store.dispatch (appStateActions.setProactiveChatRules (data.proactiveChatRules));
          store.dispatch (appStateActions.executeProactiveChatRules (data));
          break;
        case EVENT_TYPES.CMD_UPDATE_UI_CONFIG:
          store.dispatch (uiActions.updateUiConfig (data.uiConfig));
          store.dispatch (uiActions.setDeveloperUiConfig (data.uiConfig));
          appStateActions.updateStyles ();
          break;
        case EVENT_TYPES.CMD_SET_FULL_PRIVACY:
          store.dispatch (actionCreators.setFullPrivacy (data.enabled));
          break;
      }
    };

    return {
      handle: handleApis
    };
  });
