/**
 * Action creator for dispatching batched actions.
 * @author Manish Garg <manish@helpshift.com>
 * @created July 26, 2017
 */

define("actions/batch", ["constants/actionTypes"], function(ACTION_TYPES) {
  "use strict";

  return (actions) => {
    return {
      type: ACTION_TYPES.BATCH_ACTIONS,
      actions
    };
  };
});
