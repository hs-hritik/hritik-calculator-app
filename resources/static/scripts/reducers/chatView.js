/**
 * Chat view reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/chatView",
  [
    "constants/chatView",
    "constants/actionTypes"
  ],
  function (CHAT_VIEW_CONSTANTS, ACTION_TYPES) {
    "use strict";

    const update = React.addons.update;
    const {ACTIVE_FOOTER} = CHAT_VIEW_CONSTANTS;

    const INITIAL_STATE = {
      replyBox: {
        value: "",
        attachments: [],
        loading: false
      },
      activeFooter: ACTIVE_FOOTER.REPLY,
      activeIssueMsgCursor: null,
      suggestedFaqs: [],
      csatRating: 0
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.UPDATE_REPLY_TEXT:
          return update (state, {
            replyBox: {
              value: {$set: action.value}
            }
          });

        case ACTION_TYPES.SET_ACTIVE_ISSUE_MSG_CURSOR:
          return update (state, {
            activeIssueMsgCursor: {$set: action.msgCursor}
          });

        case ACTION_TYPES.SET_FAQ_SUGGESTIONS:
          return update (state, {
            suggestedFaqs: {$set: action.faqs}
          });

        case ACTION_TYPES.SET_CHAT_VIEW_FOOTER:
          return update (state, {
            activeFooter: {$set: action.footer}
          });

        case ACTION_TYPES.UPDATE_CSAT_RATING:
          return update (state, {
            csatRating: {$set: action.rating}
          });

        default:
          return state;
      }
    };
  }
);
