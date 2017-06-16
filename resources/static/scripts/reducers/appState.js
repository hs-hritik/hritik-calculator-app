/**
 * App state reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/appState",
  [
    "constants/actionTypes",
    "constants/activeView"
  ],
  function (ACTION_TYPES, ACTIVE_VIEW) {
    "use strict";

    const update = React.addons.update;

    const INITIAL_STATE = {
      collapsed: true,
      activeView: ACTIVE_VIEW.CHAT,
      activeIssueId: "",
      dummyIssueId: "DUMMY_ISSUE",
      currentUserId: "",
      appId: "",
      apiToken: "",
      domain: ""
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.SET_USER_ID:
          return update (state, {
            currentUserId: {$set: action.id}
          });

        case ACTION_TYPES.SET_CONFIG:
          return update (state, {
            appId: {$set: action.config.appId},
            apiToken: {$set: action.config.apiToken},
            domain: {$set: action.config.domain}
          });

        case ACTION_TYPES.SET_ACTIVE_ISSUE:
          return update (state, {
            activeIssueId: {$set: action.id}
          });

        case ACTION_TYPES.UPDATE_ACTIVE_VIEW:
          if (action.view !== state.activeView) {
            return update (state, {
              activeView: {$set: action.view}
            });
          }
          return state;

        default:
          return state;
      }
    };
  }
);
