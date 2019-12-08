/**
 * FAQ view reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define("reducers/faqView", ["constants/actionTypes"], function(ACTION_TYPES) {
  "use strict";

  const update = React.addons.update;

  const INITIAL_STATE = {
    activeFaq: null,
    loading: false,
    // @TODO: Move the error handling to error reducer with proper format,
    // which would have error type, title, subtitle and cta.
    errorMsg: ""
  };

  return (state = INITIAL_STATE, action) => {
    switch (action.type) {
      case ACTION_TYPES.RESET:
        return INITIAL_STATE;

      case ACTION_TYPES.SET_ACTIVE_FAQ:
        return update(state, {
          activeFaq: {$set: action.faq}
        });

      case ACTION_TYPES.TOGGLE_FAQ_LOADING:
        return update(state, {
          loading: {$set: action.loading}
        });

      case ACTION_TYPES.SET_FAQ_ERROR_MESSAGE:
        return update(state, {
          errorMsg: {$set: action.errorMsg}
        });

      default:
        return state;
    }
  };
});
