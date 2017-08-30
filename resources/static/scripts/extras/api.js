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
    "components/app"
  ],
  function (store, EVENT_TYPES, APP_STATE_CONSTANTS, ACTIVE_VIEW, postSdkMessage,
    appStateActions, chatViewActions, app) {
    "use strict";

    const {ISSUE_STATE} = APP_STATE_CONSTANTS;
    const ISSUE_CLOSED_STATES = [
      ISSUE_STATE.RESOLVED,
      ISSUE_STATE.REJECTED,
      ISSUE_STATE.RESOLVED_BY_FAQ_SUGGESTIONS
    ];

    /**
     * Set client and wm configs to the store
     * @param {Object} clientConfig
     */
    const setConfig = (clientConfig) => {
      store.dispatch (appStateActions.setClientConfig (clientConfig));
      store.dispatch (appStateActions.setIdentifier (clientConfig.userId));
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
      const {appState, chatView} = store.getState ();

      if (!minimized) {
        if (!app.isMounted ()) {
          app.init ();
        }

        // If unreadCount isn't zero and active view is chat view,
        // dispatch action to mark messages seen.
        if (chatView.unreadCount !== 0 && ACTIVE_VIEW.CHAT === appState.activeView) {
          store.dispatch (chatViewActions.markMessagesSeen ());
        }

      } else if (isIssueClosed (appState.issueState)) {
        // If minimized is true, and issue state is closed, reset the conversation.
        store.dispatch (appStateActions.reset ({
          skipUser: true
        }));
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
          store.dispatch (appStateActions.reset ());
          break;
      }
    };

    return {
      handle: handleApis
    };
  });
