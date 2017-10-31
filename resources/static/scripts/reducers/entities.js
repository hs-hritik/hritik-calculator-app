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

    const mergeEntities = (state, entities) => {
      return update (state, {
        issues: {$merge: entities.issues || {}},
        messages: {$merge: entities.messages || {}},
        authors: {$merge: entities.authors || {}},
        faqs: {$merge: entities.faqs || {}}
      });
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.REHYDRATE:
          if (action.data.entities) {
            return mergeEntities (state, action.data.entities);
          }
          return state;

        case ACTION_TYPES.SET_ENTITIES:
          return mergeEntities (state, action.entities);


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

        case ACTION_TYPES.REMOVE_MESSAGE:
          const {messages} = state.issues [action.issueId];
          const filteredMessages = messages.filter ((message) => {
            return message !== action.messageId;
          });
          return update (state, {
            issues: {
              [action.issueId]: {
                messages: {$set: filteredMessages}
              }
            }
          });

        case ACTION_TYPES.SET_MESSAGES:
          return update (state, {
            issues: {
              [action.issueId]: {
                messages: {$set: action.msgIds}
              }
            }
          });

        default:
          return state;
      }
    };
  }
);
