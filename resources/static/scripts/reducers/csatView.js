/**
 * Csat view reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 14, 2017
 */

define ("reducers/csatView",
  ["constants/actionTypes"],
  function (ACTION_TYPES) {
    "use strict";

    const update = React.addons.update;

    const INITIAL_STATE = {
      rating: 0,
      review: "",
      completed: false
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.UPDATE_CSAT_RATING:
          return update (state, {
            rating: {$set: action.rating}
          });

        case ACTION_TYPES.UPDATE_CSAT_REVIEW:
          return update (state, {
            review: {$set: action.review}
          });

        case ACTION_TYPES.MARK_CSAT_COMPLETED:
          return update (state, {
            completed: {$set: true}
          });

        default:
          return state;
      }
    };
  }
);
