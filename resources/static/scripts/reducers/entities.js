/**
 * Entities reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */
// @TODO - NORMALIZATION_CLEAN_UP
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

        case ACTION_TYPES.RESET:
          return INITIAL_STATE;

        default:
          return state;
      }
    };
  }
);
