/**
 * Chat view reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/chatView",
  [
    "constants/chatView"
  ],
  function (CHAT_VIEW_CONSTANTS) {
    "use strict";

    const {ACTIVE_FOOTER} = CHAT_VIEW_CONSTANTS;

    const INITIAL_STATE = {
      replyBox: {
        value: "",
        attachments: [],
        loading: false
      },
      activeFooter: ACTIVE_FOOTER.REPLY
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        default:
          return state;
      }
    };
  }
);
