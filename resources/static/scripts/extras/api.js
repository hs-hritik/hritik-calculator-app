/**
 * Helpshift API handler.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("extras/api",
  [
    "store",
    "constants/eventTypes",
    "utils/postMessage",
    "actions/appState",
    "components/app"
  ],
  function (store, EVENT_TYPES, postMessage, appStateActions, app) {
    "use strict";

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
     * Handle messenger toggle. Mount the top level React component if it's
     * not mounted already. Dispatch the action to update the messenger-
     * minimized flag.
     * @param {Boolean} minimized - If the messenger is in minimized state
     */
    const handleMessengerToggle = (minimized) => {
      // If the messenger is to be maximized and
      // the React app is not mounted already, mount it.
      // Let the client know that the app is mounted.
      if (!minimized && !app.isMounted ()) {
        app.init ();
        // @TODO: Temp. SDK_INITIALIZED wouldn't be required when client called
        // APIs are queued and executed subsequently.
        postMessage (EVENT_TYPES.SDK_INITIALISED);
      }

      store.dispatch (appStateActions.toggleMinimized (minimized));
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
          // @TODO: Call the action to reset the conversation (when ready)
          break;
      }
    };

    return {
      handle: handleApis
    };
  });
