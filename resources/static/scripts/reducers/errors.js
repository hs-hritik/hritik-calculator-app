/**
 * Reducer to manage error objects in the state.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created Mar 16, 2018
 */

define ("reducers/errors",
  [
    "constants/actionTypes",
    "gunpowder/utils/array"
  ],
  function (ACTION_TYPES, arrayUtils) {
    "use strict";

    const update = React.addons.update;

    /**
     * The state has a list of error objects, something like
     * [{
     *   type: "auth_failure",
     *   message: {
     *    title: "Authentication Failed",
     *    subtitle: "Unable to reach support"
     *   }
     * }, {
     *   type: "network_failure",
     *   message: {
     *    title: "You are not connected",
     *    subtitle: "Please retry"
     *   }
     * }]
     * This assumes that there would be only one error of one type at any
     * point of time. If we are to support multiple errors of the same
     * type, say two auth failure errors, we'll need to use a list of list (of
     * errors), which is an unnecessary complexity at the moment.
     */
    const INITIAL_STATE = [];

    return (state = INITIAL_STATE, action) => {

      switch (action.type) {
        case ACTION_TYPES.ADD_ERROR:
          if (!action.errorObj) {
            return state;
          }

          return update (state, {$push: [action.errorObj]});

        case ACTION_TYPES.REMOVE_ERROR:
          const indexOfErrorObj = arrayUtils.findIndexByKey (
            state,
            action.errorObj.type,
            "type"
          );

          if (indexOfErrorObj === -1) {
            return state;
          }

          return update (state, {$splice: [[indexOfErrorObj, 1]]});

        case ACTION_TYPES.RESET_ERRORS:
          return INITIAL_STATE;

        default:
          return state;
      }
    };
  }
);
