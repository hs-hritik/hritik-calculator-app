/**
 * Root reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/root",
  [
    "reducers/ui",
    "reducers/appState",
    "reducers/chatView",
    "reducers/faqView",
    "reducers/csatView",
    "reducers/businessHoursView",
    "reducers/errors",
    "constants/actionTypes"
  ],
  function (uiReducer, appStateReducer, chatViewReducer, faqViewReducer,
    csatViewReducer, businessHoursViewReducer, errorsReducer, ACTION_TYPES) {
    "use strict";

    const enableBatching = (reducer) => {
      const batchingReducer = (state, action) => {
        switch (action.type) {
          case ACTION_TYPES.BATCH_ACTIONS:
            return action.actions.reduce (batchingReducer, state);

          default:
            return reducer (state, action);
        }
      };

      return batchingReducer;
    };

    return enableBatching (Redux.combineReducers ({
      appState: appStateReducer,
      ui: uiReducer,
      chatView: chatViewReducer,
      faqView: faqViewReducer,
      csatView: csatViewReducer,
      businessHoursViewState: businessHoursViewReducer,
      errors: errorsReducer
    }));
  }
);
