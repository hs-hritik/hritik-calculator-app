/**
 * Tests for actions/csatView
 * @author Prasenjt Sharan <prasenjit@helpshift.com>
 * @created 19 June, 2019
 */

import thunk from "redux-thunk";
import axios from "axios";
import promiseFinally from "promise.prototype.finally";
import MockAdapter from "axios-mock-adapter";
import configureMockStore from "redux-mock-store";
import csatViewActions from "../../../static/scripts/actions/csatView";
import ACTION_TYPES from "../../../static/scripts/constants/actionTypes";
import ACTIVE_VIEW from "../../../static/scripts/constants/activeView";
import routes from "../../../static/scripts/constants/routes";

// Promise.finally is not integrated with the default axios package. It is recommended
// this shim to be used when it's needed.
promiseFinally.shim ();

// Use a mock store for tests. Apply redux-thunk middleware.
const middlewares = [thunk];
const mockStore = configureMockStore (middlewares);

// Mock axios
const mockXhr = new MockAdapter (axios);

const domain = "MOCK_DOMAIN";
const activeIssueId = "MOCK_ISSUE_ID";

describe ("csatView actions", () => {
  afterEach (() => {
    // After each test, removes all mock handlers to axios
    mockXhr.reset ();
  });

  it ("dispatches SET_CSAT_COMPLETED and other actions when csat is submitted", () => {
    // Mock POST csat call
    mockXhr.onPost (routes.postCSAT (domain, activeIssueId)).reply (200);

    // Expected actions when the POST request ends
    const expectedActions = [
      {
        type: ACTION_TYPES.SET_CSAT_SAVE_IN_PROGRESS,
        progress: true
      },
      {
        type: ACTION_TYPES.BATCH_ACTIONS,
        actions: [
          {
            type: ACTION_TYPES.UPDATE_ACTIVE_VIEW,
            view: ACTIVE_VIEW.CHAT
          },
          {
            type: ACTION_TYPES.SET_CSAT_COMPLETED
          },
          {
            progress: false,
            type: ACTION_TYPES.SET_CSAT_SAVE_IN_PROGRESS
          }
        ]
      }
    ];

    // Mock the store required in the csat submit flow
    const store = mockStore ({
      appState: {
        domain,
        parentPageInfo: {
          origin: "*"
        },
        activeIssueId,
        postChatFeatures: {
          csatCompleted: false
        },
        featuresEnabled: {
          resolutionQuestion: false
        }
      },
      csatView: {
        rating: 1,
        review: "MOCK_REVIEW"
      }
    });

    // Dispatch submitCsat action and verify the expected actions
    return store.dispatch (csatViewActions.submitCsat ()).then (() => {
      expect (store.getActions ()).toEqual (expectedActions);
    });
  });
});
