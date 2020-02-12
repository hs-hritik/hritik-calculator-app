/**
 * Debounce redux action.
 * @author Manish Garg <manish@helpshift.com>
 * @created Dec 27, 2019
 */

define("utils/debounceAction", ["gunpowder/utils/debounce"], function(debounce) {
  "use strict";

  /**
   * Debounce redux action.
   * @param {Object|Function} action - Redux action.
   * @param {Number} wait - Debounce wait time
   * @param {Boolean} immediate - Whether the immediate invocation is required or not.
   * @return {Function} - Debounced action
   */
  return (action, wait, immediate) => {
    const debounced = debounce(
      (dispatch, actionArgs) => dispatch(action(...actionArgs)),
      wait,
      immediate
    );

    const thunk = (...actionArgs) => (dispatch) => debounced(dispatch, actionArgs);

    return thunk;
  };
});
