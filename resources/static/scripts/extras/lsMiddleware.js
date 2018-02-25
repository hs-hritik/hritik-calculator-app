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
  function (ACTION_TYPES, objUtils, throttle, lsHelpers) {
    "use strict";

    // @TODO: Confirm what is the correct timeout for saving the
    // last activity time in localstorage.
    const LAST_ACTIVITY_THROTTLE_TIME = 20000;        // 20 seconds

    const throttledSetLastActivityTime = throttle (
      lsHelpers.setLastActivityTime,
      LAST_ACTIVITY_THROTTLE_TIME, {
        leading: false
      }
    );

    const REPLY_TEXT_THROTTLE_TIME = 3000;           // 3 seconds
    const throttledSetReplyText = throttle (lsHelpers.setReplyText, REPLY_TEXT_THROTTLE_TIME, {
      leading: false
    });

    /**
     * Save the required state in localStorage.
     * @param {Object} store
     * @param {Object} action
     */
    const saveStateInLs = (store, action) => {
      const state = store.getState ();

      switch (action.type) {
        case ACTION_TYPES.SET_CLIENT_CONFIG:
          // This is used to keep track of userId, passed with helpsfhitConfig.
          lsHelpers.setUserId (action.config.userId);
          break;

        case ACTION_TYPES.ADD_MESSAGES:
        case ACTION_TYPES.SET_MESSAGES:
          // If the action type is ADD_MESSAGES or SET_MESSAGES,
          // save the issues entities in ls.
          lsHelpers.setEntities ("ISSUES", {
            [action.issueId]: state.entities.issues [action.issueId]
          });
          throttledSetLastActivityTime ();
          break;

        case ACTION_TYPES.REMOVE_MESSAGE:
          lsHelpers.removeMessage (action.issueId, action.messageId);
          break;

        case ACTION_TYPES.SET_ENTITIES:
          // If the action type is SET_ENTITIES, save the issues
          // and messages entities in localstorage.
          // Not saving the authors entities because the system
          // generated messages don't have the author key.

          // If there are any issues entities, save it in ls.
          if (action.entities.issues) {
            lsHelpers.setEntities ("ISSUES", action.entities.issues);
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
              lsHelpers.setEntities ("MESSAGES", systemMessages);
            }
          }
          break;

        case ACTION_TYPES.SET_ACTIVE_ISSUE:
          lsHelpers.setActiveIssueId (action.id);
          break;

        case ACTION_TYPES.SET_INTERNAL_ISSUE_ID:
          lsHelpers.setInternalIssueId (action.id);
          break;

        case ACTION_TYPES.UPDATE_ISSUE_STATE:
          lsHelpers.setIssueState (action.state);
          break;

        case ACTION_TYPES.INCREMENT_PRE_CHAT_FEATURE_INDEX:
          lsHelpers.setPreChatFeatureIndex (state.appState.preChatFeatureIndex);
          break;

        case ACTION_TYPES.UPDATE_PRE_CHAT_FEATURE_STATE:
          lsHelpers.setPreChatFeatureState (state.appState.preChatFeatureState);
          break;

        case ACTION_TYPES.CHANGE_INFO_BOT_CURRENT_FIELD:
          lsHelpers.setInfoBotCurrentField (state.chatView.infoBot.currentField);
          break;

        case ACTION_TYPES.UPDATE_ACTIVE_VIEW:
          throttledSetLastActivityTime ();
          break;

        case ACTION_TYPES.UPDATE_REPLY_TEXT:
          throttledSetReplyText (action.value);
          break;

        case ACTION_TYPES.SET_USER_PROFILE_ID:
          lsHelpers.setUserProfileId (action.profileId);
          break;

        case ACTION_TYPES.SET_END_USER_FIRST_MESSAGE_ID:
          lsHelpers.setEndUserFirstMsgId (action.id);
          break;

        case ACTION_TYPES.SET_PROACTIVE_CHAT_RULES:
          // Proactive chat actions are to be executed based on the time on page
          // and time on site rules.
          // Set site activity start time in localstorage. This will be used to
          // check the `time on site` proactive chat condition.
          if (!lsHelpers.getSiteActivityStartTime ()) {
            lsHelpers.setSiteActivityStartTime (Date.now ());
          }
          break;

        case ACTION_TYPES.SET_SUGGESTED_FAQ_READ_TRACKED:
          lsHelpers.setSuggestedFaqReadTracked (action.isTracked);
          break;

        case ACTION_TYPES.SET_CONVERSATION_ID:
          lsHelpers.setConversationId (action.cid);
          break;

        case ACTION_TYPES.UPDATE_READ_FAQ_LIST:
          // Because the chat view reducer updates the chat view state with the
          // new FAQ ID by pushing it to the existing FAQ list, we can simply
          // set the local storage with that list.
          lsHelpers.setReadFaqList (state.chatView.readFaqList);
          break;

        case ACTION_TYPES.SET_INFO_BOT_REQESTED_TIMESTAMP:
          lsHelpers.setInfoBotRequestedTimestamp (action.ts);
          break;

        case ACTION_TYPES.SET_DEVICE_ID:
          // Set the device id in localstorage only if it doesn't exist already.
          if (!lsHelpers.getDeviceId ()) {
            lsHelpers.setDeviceId (action.id);
          }
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
