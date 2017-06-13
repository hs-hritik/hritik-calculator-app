/**
 * FAQ view reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/faqView",
  function () {
    "use strict";

    const INITIAL_STATE = {
      activeFaqId: "",
      loading: false
    };

    return function (state = INITIAL_STATE, action) {
      switch (action.type) {
        default:
          return state;
      }
    };
  }
);
