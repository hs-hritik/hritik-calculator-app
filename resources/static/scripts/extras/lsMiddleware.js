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
    "gunpowder/utils/throttle",
    "helpers/localStorage"
  ],
  function (ACTION_TYPES, objUtils, throttle, lsHelper) {
    "use strict";

    // @TODO: Confirm what is the correct timeout for saving the
    // last activity time in localstorage.
    const LAST_ACTIVITY_THROTTLE_TIME = 20000;        // 20 seconds

    const throttledSetLastActivityTime = throttle (
      lsHelper.setLastActivityTime,
      LAST_ACTIVITY_THROTTLE_TIME
    );

    const REPLY_TEXT_THROTTLE_TIME = 3000;           // 3 seconds
    const throttledSetReplyText = throttle (lsHelper.setReplyText, REPLY_TEXT_THROTTLE_TIME);

    /**
     * Save the required state in localStorage.
     * @param {Object} store
     * @param {Object} action
     */
    const saveStateInLs = (store, action) => {
      const state = store.getState ();

      switch (action.type) {
        case ACTION_TYPES.ADD_MESSAGES:
        case ACTION_TYPES.SET_MESSAGES:
          // If the action type is ADD_MESSAGES or SET_MESSAGES,
          // save the issues entities in ls.
          lsHelper.setEntities ("ISSUES", {
            [action.issueId]: state.entities.issues [action.issueId]
          });
          throttledSetLastActivityTime ();
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

        case ACTION_TYPES.INCREMENT_PRE_CHAT_FEATURE_INDEX:
          lsHelper.setPreChatFeatureIndex (state.appState.preChatFeatureIndex);
          break;

        case ACTION_TYPES.UPDATE_PRE_CHAT_FEATURE_STATE:
          lsHelper.setPreChatFeatureState (state.appState.preChatFeatureState);
          break;

        case ACTION_TYPES.CHANGE_INFO_BOT_CURRENT_FIELD:
          lsHelper.setInfoBotCurrentField (state.chatView.infoBot.currentField);
          break;

        case ACTION_TYPES.UPDATE_ACTIVE_VIEW:
          throttledSetLastActivityTime ();
          break;

        case ACTION_TYPES.UPDATE_REPLY_TEXT:
          throttledSetReplyText (action.value);
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
