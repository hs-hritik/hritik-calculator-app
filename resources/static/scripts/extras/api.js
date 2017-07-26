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

    const handleApis = (type, data) => {
      switch (type) {
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
