/**
 * Tests for reducers/csatView
 * @author Prasenjt Sharan <prasenjit@helpshift.com>
 * @created 20 June, 2019
 */

import csatViewReducer from "../../../static/scripts/reducers/csatView";
import ACTION_TYPES from "../../../static/scripts/constants/actionTypes";

describe("csatView reducer", () => {
  // Initial state as in the reducer
  const INITIAL_STATE = {
    rating: 3,
    review: "",
    csatSaveInProgress: false
  };

  it("should return the initial state", () => {
    expect(csatViewReducer(undefined, {})).toEqual(INITIAL_STATE);
  });

  it("should handle UPDATE_CSAT_RATING", () => {
    const state1 = csatViewReducer(INITIAL_STATE, {
      type: ACTION_TYPES.UPDATE_CSAT_RATING,
      rating: 4
    });
    expect(state1.rating).toEqual(4);

    const state2 = csatViewReducer(state1, {
      type: ACTION_TYPES.UPDATE_CSAT_RATING,
      rating: 2
    });
    expect(state2.rating).toEqual(2);
  });

  it("should handle UPDATE_CSAT_REVIEW", () => {
    const state1 = csatViewReducer(INITIAL_STATE, {
      type: ACTION_TYPES.UPDATE_CSAT_REVIEW,
      review: "MOCK_REVIEW"
    });
    expect(state1.review).toEqual("MOCK_REVIEW");

    const state2 = csatViewReducer(state1, {
      type: ACTION_TYPES.UPDATE_CSAT_REVIEW,
      review: "ANOTHER_MOCK_REVIEW"
    });
    expect(state2.review).toEqual("ANOTHER_MOCK_REVIEW");
  });

  it("should handle SET_CSAT_SAVE_IN_PROGRESS", () => {
    const state1 = csatViewReducer(INITIAL_STATE, {
      type: ACTION_TYPES.SET_CSAT_SAVE_IN_PROGRESS,
      progress: true
    });
    expect(state1.csatSaveInProgress).toEqual(true);

    const state2 = csatViewReducer(state1, {
      type: ACTION_TYPES.SET_CSAT_SAVE_IN_PROGRESS,
      progress: false
    });
    expect(state2.csatSaveInProgress).toEqual(false);
  });

  it("should handle RESET", () => {
    expect(
      csatViewReducer(
        {
          rating: 3,
          review: "MOCK_REVIEW",
          csatSaveInProgress: true
        },
        {
          type: ACTION_TYPES.RESET
        }
      )
    ).toEqual(INITIAL_STATE);
  });
});
