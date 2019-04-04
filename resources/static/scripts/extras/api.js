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
    "helpers/common",
    "extras/postSdkMessage",
    "gunpowder/utils/object"
  ],
  function (store, EVENT_TYPES, APP_STATE_CONSTANTS, ACTIVE_VIEW, analyticsConstants,
    appStateActions, chatViewActions, actionCreators, csatViewActions, uiActions,
    app, analyticsHelpers, lsHelpers, commonHelpers, postSdkMessage, objUtils) {
    "use strict";

    const {
      ISSUE_STATE,
      ISSUE_TYPE,
      PRE_ISSUE_RESET_TIMEOUT,
      APP_RESET_TRIGGER
    } = APP_STATE_CONSTANTS;

    const ISSUE_CLOSED_STATES = [
      ISSUE_STATE.RESOLVED,
      ISSUE_STATE.REJECTED,
      ISSUE_STATE.RESOLVED_BY_FAQ_SUGGESTIONS
    ];
    const SKIP_REVIEW_COMMENTS = true;

    const {EVENT} = analyticsConstants;
    const AUI_PREFIX = "hsft_anon_";
    const RE_ENGAGEMENT_USER_STATE = {
      LOGGED_IN: "logged-in",
      ANONYMOUS: "anonymous"
    };

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
     * Private method to identify if user is anonymous or known
     * @params {String} id - user id
     * @returns {Boolean}
     */
    const _isUserAnonymous = (id = "") => {
      return (id.indexOf (AUI_PREFIX) === 0);
    };

    /**
     * Handle user re-engagement
     * 1. If current user is logged-in and re-engagement user is logged-in then
     * fire an event if users are different.
     * 2. If current user is logged-in and re-engagement user is anonymous then
     * fire the user changed event.
     * 3. If current user is anonymous and re-engagement user was logged-in(known)
     * user then fire the user changed event.
     * 4. If current user is anonymous and re-engagement user is also anonymous
     * then set the localStorage value of anonUserId to re-engagement uid.
     *
     * @param {Object} clientConfig - helpshift config provided by the developer
     */
    const _handleReEngagement = (clientConfig) => {
      if (!lsHelpers.getRedirectedFlag ()) {
        return;
      }

      const reEngagementData = lsHelpers.getReEngagementData ();

      // If user is redacted then don't do anything
      if (!(reEngagementData.uid || reEngagementData.email)) {
        return;
      }

      const {dispatch} = store;
      // Re-engagement user is of type "logged-in"
      const userWasLoggedIn = (
        !(_isUserAnonymous (reEngagementData.uid)) || !!(reEngagementData.email)
      );

      // current user is logged in with userId or userEmail
      if (clientConfig.userId || clientConfig.userEmail) {
        if (userWasLoggedIn) {
          if (clientConfig.userId === reEngagementData.uid ||
              clientConfig.userEmail === reEngagementData.email) {
            // Current user and re-engagement user is same
            // Set "widgetShouldAutoOpen" to true in state so that
            // this value will be checked afterwards and widget will be opened
            // automatically.
            dispatch (appStateActions.setWidgetShouldAutoOpen (true));
          } else {
            // Current user and re-engagement users are different.
            // Fire the user changed event.
            postSdkMessage.userChanged ({
              originalState: RE_ENGAGEMENT_USER_STATE.LOGGED_IN,
              pageUrl: reEngagementData.last_session_url
            });
          }
        } else {
          // Current user is logged in & re-engagement user is anonymous.
          // Fire the user changed event
          postSdkMessage.userChanged ({
            originalState: RE_ENGAGEMENT_USER_STATE.ANONYMOUS,
            pageUrl: reEngagementData.last_session_url
          });
        }
      } else if (userWasLoggedIn) {
        // Current user is anonymous and re-engagement users is logged-in user.
        // Fire the user changed event.
        postSdkMessage.userChanged ({
          originalState: RE_ENGAGEMENT_USER_STATE.LOGGED_IN,
          pageUrl: reEngagementData.last_session_url
        });
      } else {
        // Current user is anonymous & re-engagement user is also anonymous.
        // Set value in localStorage as anon user id is picked up from the
        // localStorage.
        lsHelpers.setAnonUserId (reEngagementData.uid);

        // Set "widgetShouldAutoOpen" to true in state so that
        // this value will be checked afterwards and widget will be opened
        // automatically.
        dispatch (appStateActions.setWidgetShouldAutoOpen (true));
      }

      dispatch (appStateActions.setReEngagementId (reEngagementData.re_engagement_id));
      lsHelpers.removeReEngagementData ();
    };


    /**
     * Set the initial data to the app state.
     * @param {Object} data
     * @param {Object} data.clientConfig - Config set by the client with helpshiftConfig
     * @param {Object} data.parentPageInfo - Data (title, body) of the client website
     * @param {string} data.trigger - The source that triggered setting the config
     */
    const setConfig = (data) => {
      const {dispatch} = store;
      const {
        parentPageInfo,
        clientConfig,
        trigger
      } = data;

      // Get updated clientConfig if user has landed on page via re-engagement
      const clientConfigCopy = objUtils.shallowMerge ({}, clientConfig);
      _handleReEngagement (clientConfigCopy);

      dispatch (appStateActions.setParentPageInfo (parentPageInfo));
      dispatch (appStateActions.setClientConfig (clientConfig));
      dispatch (appStateActions.setDeviceId ());
      dispatch (appStateActions.setAnonUserId ());
      dispatch (appStateActions.setWmConfig ({
        trigger,
        helpshiftConfig: clientConfig
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
          conversationStarted,
          appResetTrigger,
          issueState,
          issueType
        }
      } = store.getState ();

      if (!minimized) {
        if (!app.isMounted ()) {
          app.init ();
        }

        // When chat widget is opened and user isn't viewing the past messages,
        // mark unread messages as seen.
        store.dispatch (chatViewActions.markMessagesSeen ());

        const preIssueIsRejected = (
          issueType === ISSUE_TYPE.PRE_ISSUE &&
          isIssueClosed (issueState)
        );
        const resetTriggerIsDefault = (appResetTrigger === APP_RESET_TRIGGER.INITIAL);
        // When the end user opens the widget, check if preIssue reset
        // is applicable and if so, handle it. Else, start a conversation, if it
        // hasn't started yet.
        if (_shouldPreIssueReset ()) {
          store.dispatch (appStateActions.resetPreIssue ());
        } else if (!conversationStarted) {
          // This is to handle special case where we get rejected preIssue on
          // first page load. We will set app trigger as pre issue reset and call
          // reset method which will create a new preIssue.
          // NOTE - Resetting preIssue and creating new preIssue should happen in
          // sequence, but these are two different api calls. So if we call reset
          // preIssue and the user closes the tab or browser, create new preIssue
          // request wont be fired and the user will keep seeing reject preIssue.
          if ((preIssueIsRejected && resetTriggerIsDefault)) {
            store.dispatch (
              appStateActions.setAppResetTrigger (APP_RESET_TRIGGER.PRE_ISSUE_RESET)
            );
            store.dispatch (appStateActions.reset ());
          } else {
            store.dispatch (appStateActions.startConversation ());
          }
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
        case EVENT_TYPES.CMD_SET_METADATA:
          store.dispatch (actionCreators.setMetadata (data.metadata));
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
        case EVENT_TYPES.CMD_UPDATE_HELPSHIFT_CONFIG:
          store.dispatch (
            appStateActions.setAppResetTrigger (APP_RESET_TRIGGER.UPDATE_HELPSHIFT_CONFIG_API)
          );
          store.dispatch (appStateActions.reset ());
          break;
      }
    };

    return {
      handle: handleApis
    };
  });
