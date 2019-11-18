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
      rating: 3,
      review: "",
      csatSaveInProgress: false
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

        case ACTION_TYPES.SET_CSAT_SAVE_IN_PROGRESS:
          return update (state, {
            csatSaveInProgress: {$set: action.progress}
          });

        case ACTION_TYPES.RESET:
          return INITIAL_STATE;

        default:
          return state;
      }
    };
  }
);
