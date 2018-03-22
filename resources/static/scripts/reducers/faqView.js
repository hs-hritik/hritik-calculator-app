/**
 * FAQ view reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/faqView",
  ["constants/actionTypes"],
  function (ACTION_TYPES) {
    "use strict";

    const update = React.addons.update;

    const INITIAL_STATE = {
      activeFaq: null,
      loading: false
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.SET_ACTIVE_FAQ:
          return update (state, {
            activeFaq: {$set: action.faq}
          });

        case ACTION_TYPES.RESET:
          return INITIAL_STATE;

        default:
          return state;
      }
    };
  }
);
