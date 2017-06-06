/**
 * App state reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/appStateReducer", [],
  function () {
    "use strict";

    const INITIAL_STATE = {
      collapsed: true,
      /**
       * Possible values: "chat", "conversations", "faq"
       */
      activeWindow: "chat",
      activeIssueId: "",
      currentUserId: ""
    };

    return function (state = INITIAL_STATE, action) {
      switch (action.type) {
        default:
          return state;
      }
    };
  }
);
