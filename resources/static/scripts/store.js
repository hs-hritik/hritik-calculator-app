/**
 * Redux store.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 8, 2017
 */

define ("store",
  ["reducers/rootReducer",
    "reduxThunk"],
  function (rootReducer, ReduxThunk) {
    "use strict";
    const createStore = Redux.createStore,
          applyMiddleware = Redux.applyMiddleware;

    return createStore (rootReducer, applyMiddleware (ReduxThunk.default));
  });
