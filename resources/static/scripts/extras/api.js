/**
 * Helpshift API hanlder.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("extras/api",
  [
    "store",
    "constants/eventTypes",
    "actions/appStateActions",
    "components/app"
  ],
  function (store, EVENT_TYPES, appStateActions, app) {
    "use strict";

    const setUser = function (data) {
      store.dispatch (appStateActions.setUser (data.id));
    };

    const handleApis = function (type, data) {
      switch (type) {
        case EVENT_TYPES.CMD_INITIALISE:
          app.init (data);
          break;
        case EVENT_TYPES.CMD_SET_USER:
          setUser (data);
          break;
      }
    };

    return {
      handle: handleApis
    };
  });
