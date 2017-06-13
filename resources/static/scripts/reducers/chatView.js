/**
 * Chat view reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/chatView",
  function () {
    "use strict";

    const INITIAL_STATE = {
      replyBox: {
        value: "",
        attachments: [],
        loading: false
      },
      /**
       * Possible values: "reply", "faqFeedback", "issueFeedback", "csatRating"
       */
      activeFooter: "reply"
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        default:
          return state;
      }
    };
  }
);
