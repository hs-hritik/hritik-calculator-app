/**
 * Root reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/rootReducer",
  ["reducers/uiReducer",
    "reducers/appStateReducer",
    "reducers/entitiesReducer",
    "reducers/chatViewReducer",
    "reducers/faqViewReducer"],
  function (uiReducer, appStateReducer, entitiesReducer, chatViewReducer, faqViewReducer) {
    "use strict";

    return Redux.combineReducers ({
      appState: appStateReducer,
      ui: uiReducer,
      entities: entitiesReducer,
      chatView: chatViewReducer,
      faqView: faqViewReducer
    });
  }
);
