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

    const setUser = (user) => {
      store.dispatch (appStateActions.setUser (user));
    };

    const handleApis = (type, data) => {
      switch (type) {
        case EVENT_TYPES.CMD_INITIALISE:
          app.init (data);
          break;
        case EVENT_TYPES.CMD_SET_USER:
          setUser (data.user);
          break;
      }
    };

    return {
      handle: handleApis
    };
  });
