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
        // @TODO: Rename SDK_INITIALISED to CMD_INITIALISE
        case EVENT_TYPES.SDK_INITIALISED:
          app.init (data);
          break;
        case EVENT_TYPES.API_SET_USER:
          setUser (data);
          break;
      }
    };

    return {
      handle: handleApis
    };
  });
