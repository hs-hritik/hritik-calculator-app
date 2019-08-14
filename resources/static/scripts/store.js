/**
 * Redux store.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 8, 2017
 */

define ("store",
  [
    "reducers/root",
    "reduxThunk",
    "extras/lsMiddleware"
  ],
  function (rootReducer, ReduxThunk, lsMiddleware) {
    "use strict";
    const {createStore, applyMiddleware} = Redux;

    return createStore (rootReducer, applyMiddleware (ReduxThunk.default, lsMiddleware));
  });
