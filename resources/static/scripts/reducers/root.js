/**
 * Root reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/root",
  [
    "reducers/ui",
    "reducers/appState",
    "reducers/entities",
    "reducers/chatView",
    "reducers/faqView",
    "reducers/csatView",
    "constants/actionTypes"
  ],
  function (uiReducer, appStateReducer, entitiesReducer, chatViewReducer,
    faqViewReducer, csatViewReducer, ACTION_TYPES) {
    "use strict";

    const enableBatching = (reducer) => {
      const batchingReducer = (state, action) => {
        switch (action.type) {
          case ACTION_TYPES.BATCH_ACTIONS:
            return action.actions.reduce (batchingReducer, state);

          case ACTION_TYPES.RESET:
            return reducer (undefined, action);

          default:
            return reducer (state, action);
        }
      };

      return batchingReducer;
    };

    return enableBatching (Redux.combineReducers ({
      appState: appStateReducer,
      ui: uiReducer,
      entities: entitiesReducer,
      chatView: chatViewReducer,
      faqView: faqViewReducer,
      csatView: csatViewReducer
    }));
  }
);
