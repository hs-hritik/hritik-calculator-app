/**
 * Localstorage middleware.
 * Save the required data in the localstorage.
 * @author Manish Garg <manish@helpshift.com>
 * @created August 11, 2017
 */

define ("extras/lsMiddleware",
  [
    "constants/actionTypes",
    "gunpowder/utils/object",
    "helpers/localStorage"
  ],
  function (ACTION_TYPES, objUtils, lsHelper) {
    "use strict";

    /**
     * Save the required state in localStorage.
     * @param {Object} store
     * @param {Object} action
     */
    const saveStateInLs = (store, action) => {

      switch (action.type) {
        case ACTION_TYPES.ADD_MESSAGES:
        case ACTION_TYPES.SET_MESSAGES:
          // If the action type is ADD_MESSAGES or SET_MESSAGES,
          // save the issues entities in ls.
          const state = store.getState ();
          lsHelper.setEntities ("ISSUES", {
            [action.issueId]: state.entities.issues [action.issueId]
          });
          break;

        case ACTION_TYPES.SET_ENTITIES:
          // If the action type is SET_ENTITIES, save the issues
          // and messages entities in localstorage.
          // Not saving the authors entities because the system
          // generated messages don't have the author key.

          // If there are any issues entities, save it in ls.
          if (action.entities.issues) {
            lsHelper.setEntities ("ISSUES", action.entities.issues);
          }

          // If there are messages entities, save only system
          // generated messages in localstorage.
          if (action.entities.messages) {
            const messages = action.entities.messages;
            const systemMessages = {};

            objUtils.forEachKey (messages, (id, msg) => {
              if (msg.isSystemMsg) {
                systemMessages [id] = msg;
              }
            });
            if (Object.keys (systemMessages).length) {
              lsHelper.setEntities ("MESSAGES", systemMessages);
            }
          }
          break;

        case ACTION_TYPES.SET_ACTIVE_ISSUE:
          lsHelper.setActiveIssueId (action.id);
          break;

        case ACTION_TYPES.UPDATE_ISSUE_STATE:
          lsHelper.setIssueState (action.state);
          break;
      }
    };

    return (store) => (next) => (action) => {
      next (action);

      if (action.type === ACTION_TYPES.BATCH_ACTIONS) {
        action.actions.forEach ((batchedAction) => {
          saveStateInLs (store, batchedAction);
        });
      } else {
        saveStateInLs (store, action);
      }
    };
  });
