/**
 * Helpshift API handler.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("extras/api",
  [
    "store",
    "constants/eventTypes",
    "actions/appState",
    "components/app"
  ],
  function (store, EVENT_TYPES, appStateActions, app) {
    "use strict";

    /**
     * Set client and wm configs to the store
     */
    const setConfig = (config) => {
      // @TODO: Use batch actions to dispatch the two actions here
      store.dispatch (appStateActions.setClientConfig (config));
      store.dispatch (appStateActions.setWmConfig ());
    };

    const handleApis = (type, data) => {
      switch (type) {
        case EVENT_TYPES.CMD_SET_CONFIG:
          setConfig (data);
          break;
        case EVENT_TYPES.CMD_INITIALISE:
          app.init (data);
          break;
        case EVENT_TYPES.CMD_SET_USER:
          store.dispatch (appStateActions.setUser (data.user));
          break;
        case EVENT_TYPES.CMD_IFRAME_TOGGLED:
          store.dispatch (appStateActions.toggleMinimized (data.minimized));
          break;
      }
    };

    return {
      handle: handleApis
    };
  });
