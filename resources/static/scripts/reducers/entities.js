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
            $merge: action.entities
          });

        default:
          return state;
      }
    };
  }
);
