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

    const update = React.addons.update;

    /**
     * Return restored state after adding api data to clean state
     * @param {Object} oldState - Old state
     * @param {Object} newState - New state
     * @returns - Restored state containing api data
     */
    const restoreApiData = (oldState, newState) => {
      const {cif} = oldState.appState;
      return update (newState, {
        appState: {
          cif: {$set: cif}
        }
      });
    };

    const enableBatching = (reducer) => {
      const batchingReducer = (state, action) => {
        switch (action.type) {
          case ACTION_TYPES.BATCH_ACTIONS:
            return action.actions.reduce (batchingReducer, state);

          // @TODO :- Reconsider this approach. Handle RESET action in each reducer
          case ACTION_TYPES.RESET:
            const newState = reducer (undefined, action);
            return restoreApiData (state, newState);

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
