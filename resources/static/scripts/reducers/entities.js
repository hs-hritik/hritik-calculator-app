/**
 * Entities reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/entities",
  ["constants/actionTypes"],
  function (ACTION_TYPES) {
    "use strict";

    const update = React.addons.update;

    const INITIAL_STATE = {
      issues: {},
      messages: {},
      authors: {},
      faqs: {}
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.SET_ENTITIES:
          return update (state, {
            issues: {$merge: action.entities.issues || {}},
            messages: {$merge: action.entities.messages || {}},
            authors: {$merge: action.entities.authors || {}},
            faqs: {$merge: action.entities.faqs || {}}
          });

        case ACTION_TYPES.ADD_MESSAGES:
          // To avoid duplication of message ids, filter the incoming message ids
          // using the current message ids.
          const currentMsgIds = state.issues [action.issueId].messages;
          const msgIdsToAdd = action.msgIds.filter ((msgId) => {
            return currentMsgIds.indexOf (msgId) === -1;
          });

          return update (state, {
            issues: {
              [action.issueId]: {
                messages: {$push: msgIdsToAdd}
              }
            }
          });

        default:
          return state;
      }
    };
  }
);
