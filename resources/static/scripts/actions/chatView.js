/**
 * Chat view actions.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 12, 2017
 */

define ("actions/chatView",
  [
    "store",
    "constants/actionTypes",
    "constants/routes",
    "constants/chatView",
    "constants/activeView",
    "constants/message",
    "constants/appState",
    "constants/errors",
    "constants/analytics",
    "gunpowder/utils/xhr",
    "gunpowder/utils/array",
    "gunpowder/utils/date",
    "actions/batch",
    "actions/actionCreators",
    "helpers/message",
    "helpers/chatView",
    "helpers/xhr",
    "helpers/audio",
    "helpers/liveUpdates",
    "helpers/attachments",
    "helpers/analytics",
    "helpers/common",
    "extras/postSdkMessage",
    "utils/browser",
    "utils/upload"
  ],
  function (store, ACTION_TYPES, routes, CHAT_VIEW_CONSTANTS, ACTIVE_VIEW,
    MESSAGE_CONSTANTS, APP_STATE_CONSTANTS, ERROR_CONSTANTS, analyticsConstants,
    xhr, arrayUtils, dateUtils, batchActions, actionCreators, messageHelpers,
    chatViewHelpers, xhrHelpers, audioHelpers, liveUpdatesHelpers, attachmentsHelpers,
    analyticsHelpers, commonHelpers, postSdkMessage, browserUtils, upload) {
    "use strict";

    const {
      TYPE: MESSAGE_TYPE,
      STATE: MESSAGES_STATE,
      BODY: MESSAGE_BODY
    } = MESSAGE_CONSTANTS;

    const {
      ACTIVE_FOOTER,
      MESSAGES_POLLING_TIMEOUT,
      MESSAGES_FORCE_POLLING_TIMEOUT,
      CURSOR_TYPES,
      USER_REDACTION_ERR_MSG,
      USER_REDACTION_ERR_STATUS_CODE
    } = CHAT_VIEW_CONSTANTS;

    const {FILE_UPLOAD_ERRORS, TYPE: ERROR_TYPES} = ERROR_CONSTANTS;

    const {
      ISSUE_STATE,
      ISSUE_TYPE,
      XHR_ISSUE_STATE
    } = APP_STATE_CONSTANTS;

    const {EVENT} = analyticsConstants;

    const update = React.addons.update;

    const PROCESS = true;
    const SKIP_PLATFORM_ID = true;
    const SHOW_PRE_ISSUE_FOOTER = true;
    const HIDE_PRE_ISSUE_FOOTER = !SHOW_PRE_ISSUE_FOOTER;

    let systemTypingTimerId = null,
        pollingEnabled = false,
        fetchMessagesXhr = null,
        fetchMessagesTimer = null,
        lastFetchStartTime = null,
        lastFetchCompleted = false,
        lastPollerCallSucceeded = false,
        agentActivitySubscribed = false;

    /**
     * Action to update reply text.
     * @param {String} value - new reply value.
     * @returns {Object} - action
     */
    const updateReplyText = (value) => {
      return {
        type: ACTION_TYPES.UPDATE_REPLY_TEXT,
        value
      };
    };

    /**
     * Action to add messages in message list.
     * This action will push given messages to the issue's messages array.
     * @param {Object} config - config
     * @param {Array} config.messages - array of response messages
     * @param {Boolean} [config.process] - whether to process messages
     * @param {Boolean} [config.prepend] - whether to push messages at the start
     * @returns {Object} - action
     */
    const addMessages = (config) => {
      const {messages, process = true, prepend = false} = config;
      let processedMessages = messages;

      if (process) {
        processedMessages = messageHelpers.getProcessedMessages (messages);
      }

      if (prepend) {
        return {
          type: ACTION_TYPES.PREPEND_MESSAGES,
          messages: processedMessages
        };
      }

      return {
        type: ACTION_TYPES.APPEND_MESSAGES,
        messages: processedMessages
      };
    };

    /**
     * To be called at specified intervals to poll for new messages.
     * If the fetching is still going on for more than
     * MESSAGES_FORCE_POLLING_TIMEOUT, it aborts the last xhr and
     * starts a new one.
     */
    const _restartFetchMessages = () => {
      if (!pollingEnabled) {
        window.clearInterval (fetchMessagesTimer);
        return;
      }

      if (lastFetchCompleted) {
        fetchMessages ();
        return;
      }

      const timeSinceLastFetch = Date.now () - lastFetchStartTime;

      if (timeSinceLastFetch >= MESSAGES_FORCE_POLLING_TIMEOUT) {
        if (fetchMessagesXhr) {
          fetchMessagesXhr.abort ();
          fetchMessagesXhr = null;
        }
        fetchMessages ();
      }
    };

    /**
     * Handle agent live updates
     */
    const handleAgentLiveUpdates = () => {
      // Do not open websocket connection if
      // a] Polling is disabled i.e. when conversation is over, user is on post
      //    chat features like resolution question, csat etc
      // b] Agent typing activity is already subscribed
      if (!pollingEnabled || agentActivitySubscribed) {
        return;
      }

      liveUpdatesHelpers.openWsConnection ();
      // Since the ws connection is asynchronous, this call to subscribe
      // to agent activity will go to the buffer and actual subscription
      // will take place when the web socket connection is completed.
      liveUpdatesHelpers.subscribeAgentActivityTopic ();
      liveUpdatesHelpers.attachAgentActivityListener ();

      agentActivitySubscribed = true;
    };

    /**
     * Start polling for messages.
     */
    const startPollingForMessages = () => {
      pollingEnabled = true;
      lastFetchCompleted = true;
      fetchMessages ();
      fetchMessagesTimer = window.setInterval (_restartFetchMessages, MESSAGES_POLLING_TIMEOUT);
    };

    /**
     * Stop polling for messages.
     * Also clear previous timeout and xhr, if any.
     */
    const stopPollingForMessages = () => {
      if (!pollingEnabled) {
        return;
      }

      window.clearInterval (fetchMessagesTimer);

      if (fetchMessagesXhr) {
        fetchMessagesXhr.abort ();
        fetchMessagesXhr = null;
      }

      pollingEnabled = false;

      liveUpdatesHelpers.unsubscribeAgentActivityTopic ();
      liveUpdatesHelpers.detachAgentActivityListener ();

      agentActivitySubscribed = false;
    };

    /**
     * Action to set active issue message cursor.
     * @param {Object} msgCursorObj - message cursor object
     * @param {Number} msgCursorObj.cursorTs - unix timestamp of message's creation time
     * @param {String} msgCursorObj.issueId - Issue ID
     * @param {String} msgCursorObj.issueType - Type of issues (PRE_ISSUE/ISSUE)
     * @param {String} msgCursorObj.cursorType - Type of cursor (FORWARD/BACKWARD)
     * @returns {Object} - action
     */
    const setActiveIssueMsgCursor = (msgCursorObj) => {
      return {
        type: ACTION_TYPES.SET_ACTIVE_ISSUE_MSG_CURSOR,
        msgCursor: msgCursorObj
      };
    };

    /**
     * Action to set unread message Ids
     * @param {Array} messageIds - array of message Ids.
     * @returns {Object} - action
     */
    const setUnreadMessageIds = (messageIds) => {
      return {
        type: ACTION_TYPES.SET_UNREAD_MESSAGE_IDS,
        messageIds
      };
    };

    /**
     * Action to mark messages seen.
     * Also set the unread messages count to zero.
     * @returns {Object} - action
     */
    const markMessagesSeen = () => {
      return (dispatch, getState) => {
        const {
          appState: {
            domain,
            activeIssueId,
            issueType
          },
          chatView: {
            unreadMessageIds
          }
        } = getState ();
        const pluralIssueType = chatViewHelpers.getPluralizedIssueType (issueType);

        // @TODO: message-Ids key is unconfirmed. Get Ack
        // from the BE team
        xhr ({
          route: routes.putMessages (domain, activeIssueId, pluralIssueType),
          data: xhrHelpers.getPreparedXhrData ({
            "md_state": "read",
            "message-ids": JSON.stringify (unreadMessageIds)
          }, SKIP_PLATFORM_ID),
          method: "PUT",
          headers: xhrHelpers.getCommonHeaders ()
        });

        if (unreadMessageIds.length !== 0) {
          dispatch (setUnreadMessageIds ([]));
          postSdkMessage.updateUnreadCount (0);
        }
      };
    };

    /**
     * Action to switch to chat view.
     * Also mark messages seen if there are any unread messages.
     * @returns {Function} - action
     */
    const switchToChatView = () => {
      return (dispatch, getState) => {
        const {unreadMessageIds, userIsViewingPastMessages} = getState ().chatView;

        if (unreadMessageIds.length !== 0 && !userIsViewingPastMessages) {
          store.dispatch (markMessagesSeen ());
        }

        dispatch (actionCreators.updateActiveView (ACTIVE_VIEW.CHAT));
      };
    };

    /**
     * Handles post chat feature steps
     * Marks post chat steps as completed depending on the config
     */
    const handlePostChatFeatureSteps = () => {
      const {dispatch, getState} = store;
      const {
        chatView: {
          isCsatSubmitted
        }
      } = getState ();
      const lastMessageType = getLatestMessage ().type;
      const actionsToDispatch = [];

      // If type of last message in message list is either accepted or rejected by user,
      // set resolution question step as completed
      if (lastMessageType === MESSAGE_TYPE.ACCEPTED ||
          lastMessageType === MESSAGE_TYPE.REJECTED) {
        actionsToDispatch.push (actionCreators.setResolutionQuestionCompleted (true));
      }

      // If csat rating is submitted by the user, set csat step as completed
      if (isCsatSubmitted) {
        actionsToDispatch.push (actionCreators.setCsatCompleted ());
      }

      dispatch (batchActions (actionsToDispatch));
    };

    /**
     * Action to set user input data
     * This action will set a default user input object and merge given input.
     * Use this action after bot to bot transitions.
     * @param {Object} input - processed input object
     * @returns {Object} - Action
     */
    const setUserInputData = (input) => {
      return {
        type: ACTION_TYPES.SET_USER_INPUT_DATA,
        input
      };
    };

    /**
     * Action to update user input data
     * This action will just update existing user input object in store.
     * Use this action to update user input during bot interaction or set errors
     * or partially update data of user input.
     * @param {Object} input - processed input object
     * @returns {Object} - Action
     */
    const updateUserInputData = (input) => {
      return {
        type: ACTION_TYPES.UPDATE_USER_INPUT_DATA,
        input
      };
    };

    /**
     * Action to set user selected option
     * @param {Object} option - selected option
     * @returns {Object} - Action
     */
    const setUserSelectedOption = (option) => {
      return {
        type: ACTION_TYPES.SET_USER_SELECTED_OPTION,
        option
      };
    };

    /**
     * Action to set user is redacted
     * @returns {Object} - Action
     */
    const setUserIsRedacted = () => {
      return {
        type: ACTION_TYPES.SET_USER_IS_REDACTED
      };
    };

    /**
     * Action to reset user input
     * This will reset label, errors, placeholders etc of user input
     * @param {Object} config - config of user values to retain
     * @returns {Object} - Action
     */
    const resetUserInput = (config = {}) => {
      return {
        type: ACTION_TYPES.RESET_USER_INPUT_DATA,
        config
      };
    };

    /**
     * Action to set active issue message cursor.
     * @param {Boolean} msgsLoaded - flag to denote if all messages have been loaded
     * @returns {Object} - action
     */
    const setAllMessagesAreLoaded = (msgsLoaded) => {
      return {
        type: ACTION_TYPES.SET_ALL_MESSAGES_ARE_LOADED,
        msgsLoaded
      };
    };

    /**
     * Handles message input
     * Parse the input data for message and save it in store
     * Set the footer depending on input type
     * Handle initial user message if set in config
     * @param {Object} message - message object
     */
    const handleMessageInput = (message) => {
      const {input} = message;
      const {dispatch} = store;

      // If bot message does not contain any input, don't process it and hide
      // the footer.
      // This is to handle bot info text messages which do not have input.
      if (!input) {
        handlePreIssueFooter (HIDE_PRE_ISSUE_FOOTER);
        return;
      }

      const {type} = message;
      const processedUserInput = chatViewHelpers.getProcessedUserInput ({
        messageType: type,
        input
      });

      dispatch (
        batchActions ([
          // Set processed user input and save it in store
          setUserInputData (processedUserInput),
          // Set footer type as reply because this is bot step, we accept some user input
          setChatViewFooter (ACTIVE_FOOTER.REPLY)
        ])
      );

      // Once bot input is processed, show the footer
      handlePreIssueFooter (SHOW_PRE_ISSUE_FOOTER);
    };

    /**
     * Handle latest message for bot actions and bot input and take actions
     * @param {Object} latestMessage - latest message in message list
     */
    const handleLatestMessage = (latestMessage) => {
      const {dispatch} = store;
      const {
        type,
        has_next_bot: hasNextBot
      } = latestMessage;

      switch (type) {
        case MESSAGE_TYPE.BOT_STARTED:
          // If the last message in poller is bot start
          // a] hide the footer
          handlePreIssueFooter (HIDE_PRE_ISSUE_FOOTER);
          break;

        case MESSAGE_TYPE.BOT_ENDED:
          // If the last message in poller is bot end
          // a] reset previous user input data and
          // b] depending on whether next step is bot, hide or show the footer
          dispatch (resetUserInput ());
          if (hasNextBot) {
            handlePreIssueFooter (HIDE_PRE_ISSUE_FOOTER);
          } else {
            handlePreIssueFooter (SHOW_PRE_ISSUE_FOOTER);
          }
          break;

        default:
          handleMessageInput (latestMessage);
      }
    };

    /**
     * Action to set issue cursor
     * Issue cursor is used to keep track of issues fetched at given time
     * @param {Number} cursor - issue cursor (unix timestamp)
     * @returns {Object} - Action
     */
    const setIssueCursor = (cursor) => {
      return {
        type: ACTION_TYPES.SET_ISSUE_CURSOR,
        cursor
      };
    };

    /**
     * Action to set csat rating submitted
     * @param {Boolean} submitted - is csat rating submitted
     */
    const setCsatSubmitted = (submitted) => {
      return {
        type: ACTION_TYPES.SET_CSAT_SUBMITTED,
        submitted
      };
    };

    /**
     * Helper method to get particular issue id of the conversation
     * @TODO: This should be moved to a helper so that other parts of
     * code can use it as well.
     * @param {Object} issue - issue object
     * @returns {String} Issue ID
     */
    const _getIssueId = (issue) => {
      if (issue.type === ISSUE_TYPE.PRE_ISSUE) {
        return issue.preissue_id;
      }

      return issue.issue_id;
    };


    /**
     * Helper method to create a date separator message
     * @param {Number} timestamp - Unix timestamp that needs to rendered
     * @param {Boolean} hr - Boolean to signify if a line is to be rendered or not
     * @returns {Object} Conversation history object.
     */
    const _getIssueDateSeparator = (timestamp, hr = true) => {
      const conversationStartDateMessage = messageHelpers.createMessage (
        MESSAGE_TYPE.CHAT_SEPARATOR, {
          hr,
          timestamp: dateUtils.format (timestamp, "{dddd}, {mmmm} {dd}, {yyyy}")
        }
      );

      return conversationStartDateMessage;
    };

    /**
     * Helper method to return index of preissue for an issue
     * @param {Array} issueList - list of issues
     * @param {String} preIssueId - Id of the preissue that needs to be found
     * @returns {Number} Matching issue for preIssue
     */
    const _getPreIssueIndex = (issueList, preIssueId) => {
      for (let i = 0; i < issueList.length; i++) {
        const issue = issueList[i];
        if (issue.type === ISSUE_TYPE.PRE_ISSUE &&
          issue.preissue_id === preIssueId) {
          return i;
        }
      }

      return -1;
    };

    /**
     * Create a linear message list from issue list
     * @param {Object} issues - Issue List
     * @param {String} lastGroupId - ID of the last pre-issue in the list
     * @returns {Array} Array of messages
     */
    const getLinearMessages = (issues, lastGroupId) => {
      const finalMessages = [];
      let previousGroupId = lastGroupId;

      let redactionCount = 0;
      issues.forEach ((issue) => {
        const currentGroupId = issue.preissue_id;

        // Count the number of redacted issues in succession.
        // Essentially, we want to show "5 Conversations Redacted"
        // when there are 5 conversations redacted in a row.
        if (issue.redacted) {
          redactionCount++;
          return;
        }

        // Render a redaction message with redaction count.
        if (redactionCount) {
          finalMessages.unshift (
            messageHelpers.createMessage (MESSAGE_TYPE.CONVERSATION_REDACTED, {
              redactionCount
            })
          );
          redactionCount = 0;
        }

        // If there has been transition from one issue to another
        // insert a date separator.
        //
        // Since issues are received with the latest issue at the top and the
        // oldest at the last, we create the right rendering order by using unshift
        if (previousGroupId && currentGroupId !== previousGroupId) {
          finalMessages.unshift (_getIssueDateSeparator (issue.created_at));
        }

        previousGroupId = currentGroupId;
        finalMessages.unshift (...issue.messages);
      });

      return finalMessages;
    };

    /**
     * Function to return a correctly ordered list of issues.
     *
     * There's a chance that issues from the backend aren't
     * in the correct order. We reorder them by searching preissue
     * for every corresponding issue.
     *
     * Basically, it makes sure that the issue list reflects the way
     * they are to be rendered (Issue-Preissue--Issue-Preissue).
     *
     * @param {Array} issueList - List of issues
     * @returns {Array} Array of issue objects
     */
    const getOrderedIssueList = (issueList) => {
      // @TODO: Check if cloning could be made more efficient
      const clonedIssueList = issueList.map ((issue) => {
        return update (issue, {});
      });
      const finalIssueList = [];

      for (let i = 0; i < clonedIssueList.length; i++) {
        const issue = clonedIssueList[i];

        if (issue.processed) {
          continue;
        }

        finalIssueList.push (issue);
        issue.processed = true;

        if (issue.type === ISSUE_TYPE.ISSUE) {
          // Find preIssue in the list and add it to final list
          const preIssueIndex = _getPreIssueIndex (clonedIssueList, issue.preissue_id);
          const preIssue = preIssueIndex !== -1 ? clonedIssueList [preIssueIndex] : null;

          // Check if the issue has already been processed in the preceding step
          if (preIssue && !preIssue.processed) {
            preIssue.processed = true;
            finalIssueList.push (preIssue);
          }
        }
      }

      return finalIssueList;
    };

    /**
     * Function to create a linear message list to be rendered
     * from the list of issues.
     * @param {Array} issueList - List of issues that have come in XHR response
     * @param {String} config.lastIssueId - Last issue ID rendered in the message list
     * @param {Boolean} config.hasOlderMsgs - Flag to determine if there are more messages
     *                                        left to be rendered.
     * @returns {Array} List of messages
     */
    const createLinearMessageList = (issueList, config) => {
      const {
        lastGroupId,
        hasOlderMsgs
      } = config;

      const orderedIssues = getOrderedIssueList (issueList);
      const linearMsgList = getLinearMessages (orderedIssues, lastGroupId);

      if (!linearMsgList.length) {
        return [];
      }

      // if there are no more messages remaining to be fetched, we should
      // render the timestamp without a <hr> at the top of list
      if (hasOlderMsgs === false) {
        const oldestIssue = issueList [issueList.length - 1];

        linearMsgList.unshift (
          _getIssueDateSeparator (oldestIssue.created_at, false)
        );
      }

      return linearMsgList;
    };

    /**
     * Returns active issue and list of messages
     * @param {Object} config - config for creating active issue and  message list
     * @param {Object} config.issues - issues list
     * @returns {Object} - config of active issue and messages
     */
    const getCurrentIssueAndMessages = (config) => {
      const {
        chatView: {
          issueCursor
        },
        appState: {
          featuresEnabled: {
            conversationHistory
          }
        }
      } = store.getState ();
      const {issues, hasOlderMsgs} = config;
      const currentIssue = issues [0];
      let previousIssue = null;
      let messages = [];

      // If current issue type is 'issue', find pre issue from issues list
      // and save it in previous
      if (currentIssue && currentIssue.type === ISSUE_TYPE.ISSUE) {
        previousIssue = arrayUtils.find (issues, (issue) => {
          return (issue.type === ISSUE_TYPE.PRE_ISSUE &&
                  issue.preissue_id === currentIssue.preissue_id);
        });
      }

      // If conversation history is disabled, we only render the
      // currentIssue and its pre-issue.
      let conversationIssues = issues;
      if (!conversationHistory) {
        conversationIssues = [currentIssue, previousIssue];
      }

      messages = createLinearMessageList (conversationIssues, {
        lastIssueId: null,
        conversationHistory,
        hasOlderMsgs
      });

      // When a preIssue gets converted to an issue, track issue_created event.
      // When the preIssue gets converted to an issue, the preIssue object's status
      // becomes "issue-created". We want to track this event when an issue gets
      // created during conversation and not when the page is loaded and all the
      // issue objects (preIssue and issue) are fetched. We identify this if the
      // issueCursor value is not 0 (the default value).
      if (
        issueCursor &&
        previousIssue &&
        previousIssue.state_data.state === XHR_ISSUE_STATE.PRE_ISSUE.ISSUE_CREATED
      ) {
        analyticsHelpers.track (EVENT.ISSUE_CREATED, {
          issueId: currentIssue.issue_id
        });
      }

      return {
        currentIssue,
        messages
      };
    };

    /**
     * Handle chat end
     * a] Either show start new conversation footer or close conversation footer
     * b] Add chat ended message in message list
     * @param {Object} config - config object
     * @param {Boolean} config.conversationHasEnded - Should conversation
     *                                                     closed message be rendered.
     */
    const handleChatEnd = (config) => {
      const {dispatch, getState} = store;
      const {conversationHasEnded} = config;
      const {
        appState: {
          sdkConfigOptions: {
            initialUserMessage
          }
        },
        ui: {
          text
        }
      } = getState ();
      const conversationClosedMsg = conversationHasEnded ? text.conversationClosed : "";

      // If initial user message is set through api, show close conversation footer
      // Else show start new conversation footer
      if (initialUserMessage) {
        // Show closed conversation footer
        dispatch (setChatViewFooter (ACTIVE_FOOTER.CLOSED));
      } else {
        // Show start new conversation footer
        dispatch (setChatViewFooter (ACTIVE_FOOTER.START_NEW_CONVERSATION));
      }

      // Show system info message - This conversation has ended.
      dispatch (createMessage ({
        type: MESSAGE_TYPE.CHAT_SEPARATOR,
        messageConfig: {
          infoText: conversationClosedMsg,
          hr: true
        }
      }));
    };

    /**
     * Handle issue state
     * If issue state is not active, stop the poller and issue type is
     * a. 'issue' then handle post chat features
     * b. 'preissue' then show start new conversation footer
     */
    const handleIssueState = () => {
      const {dispatch, getState} = store;
      const {
        appState: {
          issueType,
          issueState
        }
      } = getState ();

      // Do not handle active state as we will wait for user input/bot steps
      if (issueState === ISSUE_STATE.ACTIVE) {
        return;
      }

      // We get agent typing indicator from websocket, but issue is resolved by
      // poller. The TAI keeps showing for few seconds which is pre-defined behaviour.
      dispatch (actionCreators.toggleAgentTyping (false));

      if (issueState === ISSUE_STATE.RESOLVED) {
        // If issue type is 'issue'
        // a. handle post chat features
        // b. show post issue resolution footer (resolution question | csat |
        //    start new conversation)
        // Else if issue type is 'preissue' then handle end chat
        if (issueType === ISSUE_TYPE.ISSUE) {
          handlePostChatFeatureSteps ();
          dispatch (showPostIssueResolutionFooter ());
        } else if (issueType === ISSUE_TYPE.PRE_ISSUE) {
          // If preIssue is resolved i.e. user has accepted faq suggestions, then
          // provide an option to start new conversation
          handleChatEnd ({
            conversationHasEnded: false
          });
        }
      } else if (issueState === ISSUE_STATE.REJECTED) {
        // Show "Conversation Closed" message and "Start a new conversation"
        // button when the issue is rejected
        handleChatEnd ({
          conversationHasEnded: true
        });
      }
    };

    /**
     * Predicate to return whether issue is active
     * @param {String} issueState - state of issue
     */
    const isIssueActive = (issueState) => {
      return (chatViewHelpers.getProcessedIssueState (issueState) ===
              ISSUE_STATE.ACTIVE);
    };

    /**
     * Action to set poller failure count
     * @param {Boolean} count - Poller failure count
     * @returns {Object} - Action
     */
    const setPollerFailureCount = (count) => {
      return {
        type: ACTION_TYPES.SET_POLLER_FAILURE_COUNT,
        count
      };
    };

    /**
     * Handle create preIssue for initial user message
     * If first user message is set through api and issue is not active then
     * create new preIssue
     * @param {Object} config
     * @param {Number} config.issueCursor - issue cursor
     * @returns {Boolean} - whether create preIssue is called
     */
    const handleCreatePreIssueForInitialUserMessage = (config) => {
      let preIssueActionTriggered = false;
      // Return if poller has run more than once
      // We need to handle initial user message only on page refresh
      if (config.issueCursor) {
        return preIssueActionTriggered;
      }

      const {dispatch, getState} = store;
      const {
        appState: {
          sdkConfigOptions: {
            initialUserMessage
          }
        }
      } = getState ();

      if (initialUserMessage) {
        dispatch (createPreIssue ());
        preIssueActionTriggered = true;
      }

      return preIssueActionTriggered;
    };

    /**
     * Checks if all the conversation have been redacted and
     * creates a new preIssue + stops polling when they have been.
     * @param {Object} config - conversation redaction config.
     * @param {Array} config.messages - messages length
     * @param {Object} config.issueCursor - used to check if it's the first
     *                                      fetch call
     * @returns {Boolean} - weather all the conversations have been redacted
     */
    const handleAllConversationRedaction = (config) => {
      const {dispatch} = store;
      const {messages, issueCursor} = config;

      // If all the conversations have been redacted there would
      // be no messages and we should start conversation anew.
      if (!messages.length && !issueCursor) {
        dispatch (createPreIssue ());
        stopPollingForMessages ();
        return true;
      }

      return false;
    };

    /**
     * Set the forward/backward message cursors from the issue list
     * @param {Object} messageCursorConfig
     * @param {Array} messageCursorConfig.issues - list of issues
     * @param {String} messageCursorConfig.cursorType - type of cursor (FORWARD/BACKWARD)
     * @param {Number} messageCursorConfig.cursorTs - unix timestamp of message whose cursor
     *                                                needs to be set. Only needed FORWARD cursor.
     */
    const saveMessageCursor = (messageCursorConfig) => {
      const {dispatch} = store;
      const {
        issue,
        cursorType,
        cursorTs
      } = messageCursorConfig;

      if (cursorType === CURSOR_TYPES.FORWARD) {
        dispatch (
          setActiveIssueMsgCursor ({
            cursorType,
            cursorTs,
            issueType: issue.type,
            issueId: _getIssueId (issue)
          })
        );
      } else {
        const oldestIssueMessages = issue.messages;
        const oldestTimestamp = oldestIssueMessages [0].created_at;

        dispatch (
          setActiveIssueMsgCursor ({
            cursorType,
            cursorTs: oldestTimestamp,
            issueType: issue.type,
            preissueId: issue.preissue_id,
            issueId: _getIssueId (issue)
          })
        );
      }
    };

    /**
     * Handle submit initial user message for bot step
     * @param {String} messageType - Type of message
     */
    const handleSubmitInitialUserMessage = (messageType) => {
      const {dispatch, getState} = store;
      const {
        appState: {
          sdkConfigOptions: {
            initialUserMessage
          }
        }
      } = getState ();

      // If message type is accept first user message (EMPTY_MSG_WITH_TEXT_INPUT)
      // and initialUserMessage is set through api, do not wait for user input
      // Directly send the message as bot response
      if (messageType === MESSAGE_TYPE.EMPTY_MSG_WITH_TEXT_INPUT && initialUserMessage) {
        dispatch (
          updateReplyText (initialUserMessage)
        );
        postUserMessage ({
          msgType: messageType,
          msgBody: initialUserMessage
        });
      }
    };

    /**
     * Show/Hide past conversations loading animation
     * @param {Boolean} loading - should the conversations loading animation be shown
     * @returns {Object} action
     */
    const toggleConversationsLoader = (loading) => {
      return {
        type: ACTION_TYPES.TOGGLE_CONVERSATIONS_LOADER,
        loading
      };
    };

    /**
     * Fire xhr to load more messages.
     * @param {Object} config - data required for xhr
     * @param {Function} config.onSuccess - success callback
     * @param {Function} config.onEnd - end callback
     */
    const loadMoreMessages = () => {
      const {dispatch, getState} = store;
      const {
        appState: {
          domain
        },
        chatView: {
          messageCursor: {
            [CURSOR_TYPES.BACKWARD]: {
              value: cursorTs,
              meta: {
                issueType,
                preIssueId,
                issueId
              }
            }
          },
          pastConversationsLoading
        }
      } = getState ();

      // If messages are already being loaded, return.
      if (pastConversationsLoading) {
        return;
      }

      const isIssue = issueType === ISSUE_TYPE.ISSUE;
      const xhrData = {
        cursor: cursorTs
      };

      if (isIssue) {
        xhrData.issue_id = issueId;
      } else {
        xhrData.preissue_id = issueId;
      }

      dispatch (toggleConversationsLoader (true));

      xhr ({
        route: routes.getConversationHistory (domain),
        data: xhrHelpers.getPreparedXhrData (xhrData),
        method: "POST",
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
          const {
            issues,
            has_older_messages: hasOlderMsgs
          } = response;

          if (!issues.length) {
            return;
          }

          const linearMsgs = createLinearMessageList (issues, {
            lastGroupId: preIssueId,
            hasOlderMsgs
          });

          const oldestIssue = issues [issues.length - 1];

          dispatch (
            batchActions ([
              toggleConversationsLoader (false),
              addMessages ({
                messages: linearMsgs,
                prepend: true
              }),
              setAllMessagesAreLoaded (!hasOlderMsgs)
            ])
          );

          saveMessageCursor ({
            issue: oldestIssue,
            cursorType: CURSOR_TYPES.BACKWARD
          });
        }
      });
    };

    /**
     * Xhr to fetch active issue messages.
     * On success, add messages to the store and also update the active
     * issue message cursor.
     * If polling is enabled, call itself when the xhr ends.
     */
    const fetchMessages = () => {
      const {dispatch} = store;
      const {
        appState: {
          domain,
          issueType: previousIssueType
        },
        chatView: {
          messageCursor: {
            forward: forwardMessageCursor
          },
          issueCursor,
          pollerFailureCount: prevPollerFailureCount
        }
      } = store.getState ();

      const xhrData = {};
      const {
        meta: {
          issueId: forwardMsgIssueId,
          issueType
        }
      } = forwardMessageCursor;

      if (forwardMsgIssueId) {
        if (issueType === ISSUE_TYPE.PRE_ISSUE) {
          xhrData.preissue_id = forwardMsgIssueId;
        } else if (issueType === ISSUE_TYPE.ISSUE) {
          xhrData.issue_id = forwardMsgIssueId;
        }
      }

      if (issueCursor) {
        xhrData.cursor = issueCursor;
      }

      lastFetchStartTime = Date.now ();
      lastFetchCompleted = false;

      // @TODO: Confirm the keys after discussing with backend
      fetchMessagesXhr = xhr ({
        route: routes.getConversationUpdates (domain),
        data: xhrHelpers.getPreparedXhrData (xhrData),
        method: "POST",
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
          // @NOTE - This is to make sure that onEnd is called even if
          // any code in onSuccess results in an Exception.
          try {
            lastPollerCallSucceeded = true;
            const {
              has_older_messages: hasOlderMsgs,
              issues = [],
              cursor
            } = response;

            if (!issues.length) {
              return;
            }

            const {
              currentIssue,
              messages
            } = getCurrentIssueAndMessages ({issues, hasOlderMsgs});

            const conversationsRedacted = handleAllConversationRedaction ({
              msgsLength: messages.length,
              issueCursor
            });

            if (conversationsRedacted) {
              return;
            }

            const {
              publish_id: issueId,
              type: currentIssueType,
              state_data: {
                state: issueState
              },
              csat_received: isCsatSubmitted
            } = currentIssue;

            const isPreIssue = (currentIssueType === ISSUE_TYPE.PRE_ISSUE);
            const internalIssueId = _getIssueId (currentIssue);

            if (!isIssueActive (issueState)) {
              stopPollingForMessages ();

              const preIssueActionTriggered = handleCreatePreIssueForInitialUserMessage ({
                issueCursor
              });

              if (preIssueActionTriggered) {
                return;
              }
            }

            handlePreIssueToIssueConversion ({
              currentIssueType,
              previousIssueType
            });

            dispatch (
              batchActions ([
                // We stop loading after the first response from poller because
                // we want to show loader until we get the first message from the backend
                actionCreators.toggleChatViewLoading (false),
                setActiveIssueId (issueId),
                actionCreators.setInternalIssueId (internalIssueId),
                setCsatSubmitted (isCsatSubmitted),
                updateIssueState (issueState, PROCESS),
                updateIssueType (currentIssueType)
              ])
            );

            if (!isPreIssue) {
              handleAgentLiveUpdates ();
            }

            const messagesLength = messages.length;
            if (messagesLength) {
              const latestMessage = messages [messagesLength - 1];
              const processedMessages = messageHelpers.getProcessedMessages (messages);

              // Handle latest message only for preIssue
              if (isPreIssue) {
                handleLatestMessage (latestMessage);
              }

              dispatch (
                addMessages ({
                  messages: processedMessages,
                  process: false
                })
              );

              saveMessageCursor ({
                issue: currentIssue,
                cursorTs: cursor,
                cursorType: CURSOR_TYPES.FORWARD
              });

              // Only set the backward cursor when initial issues are being
              // fetched, not when updates for issues are being recieved.
              //
              // Note: This works because issueCursor is not first before
              // first call.
              if (!issueCursor) {
                const oldestIssue = issues [issues.length - 1];

                dispatch (
                  setAllMessagesAreLoaded (!hasOlderMsgs)
                );

                saveMessageCursor ({
                  issue: oldestIssue,
                  cursorType: CURSOR_TYPES.BACKWARD
                });
              }

              if (isPreIssue) {
                // Post user reply requires the messages to be added and user
                // input to be set.
                // This will only send first user message in api call.
                // Final sequence :-
                // 1. Handle latest message - show/hide footer
                // 2. Add messages - Will scroll the messages to bottom
                // 3. Handle submit first message - Actully fire xhr to post
                //    user's first message to bot.
                handleSubmitInitialUserMessage (latestMessage.type);
              }

              handleUnreadMessages ({
                messages: processedMessages
              });
            }
            handleIssueState ();

            dispatch (setIssueCursor (cursor));
          } catch (ex) {
            // @TODO - Ideally, this exception should be logged to server.
          }
        },
        onFailure: (response, statusCode) => {
          // @TODO: Need to confirm the exact message and key from the backend.
          if (response.msg === USER_REDACTION_ERR_MSG &&
            statusCode === USER_REDACTION_ERR_STATUS_CODE) {
            dispatch (setUserIsRedacted ());
          }
        },
        onEnd: () => {
          const newPollerFailureCount = lastPollerCallSucceeded ? 0 : (prevPollerFailureCount + 1);

          if (newPollerFailureCount !== prevPollerFailureCount) {
            dispatch (setPollerFailureCount (newPollerFailureCount));
          }

          lastFetchCompleted = true;
          lastPollerCallSucceeded = false;
        }
      });
    };

    /**
     * Handle TAI and enabling of chat footer
     * @param {Boolean} showFooter - whether to hide TAI and show footer
     */
    const handlePreIssueFooter = (showFooter) => {
      const {dispatch} = store;

      if (showFooter) {
        dispatch (batchActions ([
          enableReplyBox (),
          toggleSystemTyping (false)
        ]));
      } else {
        dispatch (batchActions ([
          disableReplyBox (),
          toggleSystemTyping (true)
        ]));
      }
    };

    /**
     * Handle conversion of preIssue to issue
     * @param {Object} config
     * @param {String} config.currentIssueType - current issue type
     * @param {String} config.previousIssueType - previous issue type
     */
    const handlePreIssueToIssueConversion = (config) => {
      const {dispatch} = store;
      const {currentIssueType, previousIssueType} = config;
      const preIssueConvertedToIssue = (previousIssueType === ISSUE_TYPE.PRE_ISSUE &&
                                        currentIssueType === ISSUE_TYPE.ISSUE);

      // If preIssue is converted to issue then reset user input and show footer
      if (preIssueConvertedToIssue) {
        dispatch (resetUserInput ());
        handlePreIssueFooter (SHOW_PRE_ISSUE_FOOTER);
      }
    };

    /**
     * Handle unread messages
     * Calculate unread (agent) message count by checking each message
     * If the widget is minimized, post message to parent with unread count which
     * will show unread notification on widget
     * @param {Object} config
     * @param {Array} config.messages - processed poller messages
     */
    const handleUnreadMessages = (config) => {
      const {dispatch, getState} = store;
      const {
        appState: {
          minimized,
          activeView
        },
        chatView: {
          unreadMessageIds,
          issueCursor,
          userIsViewingPastMessages
        }
      } = getState ();
      const {messages} = config;

      // Clone the existing list of message ids.
      const finalUnreadMessageIds = unreadMessageIds.slice (0);

      // Calculate unread count for agent messages only
      messages.forEach ((msg) => {
        const {
          id,
          type,
          state,
          isCustomerMsg
        } = msg;

        if (!isCustomerMsg &&
            state !== MESSAGES_STATE.READ &&
            type !== MESSAGE_TYPE.CHAT_SEPARATOR &&
            messageHelpers.isRenderableMessage (type)) {
          finalUnreadMessageIds.push (id);
        }
      });

      // If the chat view is active, the messenger is not in minimized state,
      // and the user is not viewing past messages that means the user
      // has seen the messages.
      if (!minimized && ACTIVE_VIEW.CHAT === activeView &&
          !userIsViewingPastMessages) {
        dispatch (markMessagesSeen ());
      } else {
        dispatch (setUnreadMessageIds (finalUnreadMessageIds));
        postSdkMessage.updateUnreadCount (finalUnreadMessageIds.length);
      }

      // Do not play sound on page load even if there are unread messages
      if (issueCursor && finalUnreadMessageIds.length) {
        audioHelpers.playReceive ();
      }
    };

    /**
     * Action to show footer post issue resolution
     * @returns {Function} - Action
     */
    const showPostIssueResolutionFooter = () => {
      return (dispatch, getState) => {
        const {
          appState: {
            issueState,
            postChatFeatures: {
              resolutionQuestionCompleted,
              csatCompleted
            },
            featuresEnabled: {
              resolutionQuestion: resolutionQuestionEnabled,
              csatBot: csatBotEnabled
            }
          }
        } = getState ();

        if (resolutionQuestionEnabled && !resolutionQuestionCompleted) {
          dispatch (setChatViewFooter (
            ACTIVE_FOOTER.CONVERSATION_RESOLUTION_QUESTION
          ));
        } else if (csatBotEnabled && !csatCompleted) {
          dispatch (setChatViewFooter (ACTIVE_FOOTER.CSAT));
          // Track the CSAT requested event.
          analyticsHelpers.track (EVENT.CSAT, {
            event: EVENT.CSAT_REQUESTED
          });
        } else {
          handleChatEnd ({
            conversationHasEnded: issueState === ISSUE_STATE.REJECTED
          });
        }
      };
    };

    /**
     * Action to change chat view footer.
     * @param {String} footer
     * @returns {Object} - action
     */
    const setChatViewFooter = (footer) => {
      return {
        type: ACTION_TYPES.SET_CHAT_VIEW_FOOTER,
        footer
      };
    };

    /**
     * Fire xhr to post message as a user.
     * @param {Object} config - data required for xhr
     * @param {String} config.msgBody - message body
     * @param {String} config.msgType - message type
     * @param {Function} config.onSuccess - success callback
     * @param {Function} config.onEnd - end callback
     */
    const postUserMessage = (config) => {
      const {dispatch, getState} = store;
      const {
        chatView: {
          userInput
        },
        appState: {
          domain,
          activeIssueId,
          issueType
        }
      } = getState ();
      const {
        msgBody,
        msgType,
        onSuccess,
        onEnd
      } = config;
      const xhrIssueType = chatViewHelpers.getPluralizedIssueType (issueType);
      const actionsToDispatch = [disableReplyBox ()];
      const isIssue = issueType === ISSUE_TYPE.ISSUE;
      const isPreIssue = issueType === ISSUE_TYPE.PRE_ISSUE;
      let xhrData = {};

      if (isIssue) {
        // @TODO - Change request params after apis are changed.
        // Currently the request params for issue remains same, only pre-issue
        // params are different.
        xhrData = {
          "message-body": msgBody,
          "message-type": msgType
        };
      } else {
        actionsToDispatch.push (toggleSystemTyping (true));
        xhrData = messageHelpers.getPreparedMessageData ({
          input: userInput,
          message: getLatestMessage ()
        });
      }

      dispatch (batchActions (actionsToDispatch));

      xhr ({
        route: routes.postUserReply (domain, activeIssueId, xhrIssueType),
        data: xhrHelpers.getPreparedXhrData (xhrData, SKIP_PLATFORM_ID),
        method: "POST",
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
          // We do not want to batch following actions as we have to explicitly
          // enable reply box first and then add messages.
          // This is to allow reply box to take height first and then message list
          // updation will scroll the messages to bottom.
          // In case of preIssue, we do not want to enable reply box as it will be
          // enabled according to next bot step.
          if (isIssue) {
            dispatch (enableReplyBox ());
          }
          dispatch (
            batchActions ([
              addMessages ({
                messages: [response]
              }),
              updateReplyText ("")
            ])
          );

          if (onSuccess) {
            onSuccess (response);
          }
        },
        onFailure: () => {
          // If user reply on
          // 1. preIssue fails
          //    a. Hide typing indicator
          //    b. Enable replyBox
          // This enables text and pill options input in case of failure
          // OR
          // 2. issue fails
          //    a. Enable reply box
          if (isPreIssue) {
            dispatch (batchActions ([
              enableReplyBox (),
              toggleSystemTyping (false)
            ]));
          } else if (isIssue) {
            dispatch (enableReplyBox ());
          }
        },
        onEnd
      });
    };

    /**
     * Action to disable reply box.
     * @returns {Object} - action
     */
    const disableReplyBox = () => {
      return {
        type: ACTION_TYPES.DISABLE_REPLY_BOX
      };
    };

    /**
     * Action to enable reply box.
     * @returns {Object} - action
     */
    const enableReplyBox = () => {
      return {
        type: ACTION_TYPES.ENABLE_REPLY_BOX
      };
    };

    /**
     * Action to submit reply.
     * @returns {Object} - action
     */
    const submitReply = () => {
      return (dispatch, getState) => {
        const state = getState ();
        const {
          appState: {
            activeIssueId,
            issueState
          },
          chatView: {
            userInput
          },
          ui: {
            text
          }
        } = state;
        const trimmedValue = userInput.value.trim ();

        if (!userInput.selectedOption && (userInput.disabled || !trimmedValue)) {
          return;
        }

        const validationConfig = chatViewHelpers.getUserInputValidationConfig (
          userInput,
          text
        );

        if (validationConfig.errorMsg) {
          dispatch (updateUserInputData (validationConfig));
          return;
        }

        // If current issue state is rejected, don't fire xhr to send messages to backend.
        if (issueState === ISSUE_STATE.REJECTED) {
          dispatch (
            createMessage ({
              type: MESSAGE_TYPE.TEXT,
              issueId: activeIssueId,
              messageConfig: {
                body: trimmedValue,
                isCustomerMsg: true
              },
              onAddMessage: () => {
                dispatch (updateReplyText (""));
              }
            })
          );
          return;
        }

        dispatch (disableReplyBox ());
        // @TODO - Find a place to track conversation started event
        // Track the conversation started event.
        // analyticsHelpers.track (EVENT.CONVERSATION_STARTED);

        postUserMessage ({
          msgBody: trimmedValue,
          msgType: MESSAGE_TYPE.TEXT,
          onSuccess: () => {
            handleIssueReopen (issueState);
            dispatch (updateReplyText (""));
            audioHelpers.playSend ();
          }
        });
      };
    };

    /**
     * Handle issue reopen case when user sends a message after issue is resolved
     * @param {String} issueState - state of issue
     */
    const handleIssueReopen = (issueState) => {
      const {dispatch} = store;
      // Set resolution question step as incomplete if the user has added
      // a message after the issue is resolved. Also start polling for new messages.
      if (issueState === ISSUE_STATE.RESOLVED) {
        dispatch (
          batchActions ([
            actionCreators.setResolutionQuestionCompleted (false),
            setChatViewFooter (ACTIVE_FOOTER.REPLY),
            updateIssueState (ISSUE_STATE.ACTIVE)
          ])
        );
        startPollingForMessages ();
      }
    };

    /**
     * Return latest message object from message list
     */
    const getLatestMessage = () => {
      const {
        chatView: {
          messageList
        }
      } = store.getState ();
      return messageList [messageList.length - 1];
    };

    /**
     * Action to set chat view error.
     * @param {Object} error
     * @param {String} error.type - Error type - For example, pre issue failure
     * @param {String} error.title
     * @param {String} [error.subtitle]
     * @param {String} [error.cta] - Call to action text
     * @returns {Object} - action
     */
    const setChatViewError = (error) => {
      return {
        type: ACTION_TYPES.SET_CHAT_VIEW_ERROR,
        error
      };
    };

    /**
     * Action to reset chat view error.
     * @returns {Object} - action
     */
    const resetChatViewError = () => {
      return {
        type: ACTION_TYPES.RESET_CHAT_VIEW_ERROR
      };
    };

    /**
     * Create pre-issue on backend.
     */
    const createPreIssue = () => {
      return (dispatch, getState) => {
        const {
          appState: {
            domain,
            tags,
            cif,
            metadata,
            featuresEnabled: {
              greeting: greetingFeatureEnabled
            },
            fullPrivacyEnabled,
            developerSetLanguage,
            userName,
            userId
          },
          ui: {
            text: {
              greetingMsg,
              networkError,
              retryBtn
            }
          }
        } = getState ();

        // Prepare XHR data
        const meta = {
          device_info: metadata
        };

        if (tags) {
          meta.custom_meta = {
            "hs-tags": tags
          };
        }

        const xhrData = {
          meta: JSON.stringify (meta)
        };

        // If CIF is set and contains at least one field, add it to XHR data
        if (cif && Object.keys (cif).length) {
          xhrData.custom_fields = JSON.stringify (cif);
        }

        if (greetingFeatureEnabled) {
          xhrData.greeting = greetingMsg;
        }

        if (fullPrivacyEnabled) {
          xhrData.fp_status = true;
        } else if (userName) {
          // Set name if fullPrivacy mode is off
          xhrData.name = userName;
        }

        xhrData.device_language = browserUtils.getLanguage ();

        if (developerSetLanguage) {
          xhrData.developer_set_language = developerSetLanguage;
        }

        // Passing user_id is a temporary backend requirement.
        if (userId) {
          xhrData.user_id = userId;
        }

        dispatch (actionCreators.toggleChatViewLoading (true));

        // We need to hide footer while creating preIssue because the default
        // value of input disabled is false, in store on page refresh.
        handlePreIssueFooter (HIDE_PRE_ISSUE_FOOTER);

        xhr ({
          route: routes.postPreIssue (domain),
          data: xhrHelpers.getPreparedXhrData (xhrData),
          headers: xhrHelpers.getCommonHeaders (),
          method: "POST",
          onSuccess: (response) => {
            const newIssueId = response.id;
            const internalId = response.type === ISSUE_TYPE.PRE_ISSUE ?
              response.preissue_id : response.issue_id;

            dispatch (
              batchActions ([
                setActiveIssueId (newIssueId),
                actionCreators.setInternalIssueId (internalId),
                updateIssueState (ISSUE_STATE.ACTIVE),
                setChatViewFooter (ACTIVE_FOOTER.REPLY)
              ])
            );
            startPollingForMessages ();
            dispatch (resetChatViewError ());

            // Track the issue created event.
            // @TODO: Confirm if issue created event has to be tracked from Web Chat.
            // analyticsHelpers.track (EVENT.ISSUE_CREATED);
          },
          onFailure: () => {
            dispatch (batchActions ([
              setChatViewError ({
                type: ERROR_TYPES.PRE_ISSUE_FAILURE,
                title: networkError,
                cta: retryBtn
              }),
              actionCreators.toggleChatViewLoading (false)
            ]));
          }
        });
      };
    };

    /**
     * Action to handle error.
     * @TODO: Move the error handling to separate error actions file.
     * @returns {Function} - action
     */
    const handleErrorAction = () => {
      return (dispatch, getState) => {
        const {type: errorType} = getState ().chatView.error;

        switch (errorType) {
          case ERROR_TYPES.PRE_ISSUE_FAILURE:
            dispatch (createPreIssue ());
            break;
        }
      };
    };

    /**
     * Action to set active issue id.
     * @param {String} activeIssueId - active issue id.
     * @returns {Object} - action
     */
    const setActiveIssueId = (activeIssueId) => {
      return {
        type: ACTION_TYPES.SET_ACTIVE_ISSUE_ID,
        id: activeIssueId
      };
    };

    /**
     * Action to update issue state.
     * @param {String} state - new state.
     * @returns {Object} - action
     */
    const updateIssueState = (state, process) => {
      let processedState = state;

      if (process) {
        processedState = chatViewHelpers.getProcessedIssueState (state);
      }

      return {
        type: ACTION_TYPES.UPDATE_ISSUE_STATE,
        state: processedState
      };
    };

    /**
     * Action to update issue type.
     * @param {String} issueType - new type.
     * @returns {Object} - action
     */
    const updateIssueType = (issueType) => {
      return {
        type: ACTION_TYPES.UPDATE_ISSUE_TYPE,
        issueType
      };
    };

    /**
     * Action to toggle system typing flag.
     * @param {Boolean} typing - Set typing to true or false.
     * @returns {Object} - Action
     */
    const toggleSystemTyping = (typing) => {
      return {
        type: ACTION_TYPES.TOGGLE_SYSTEM_TYPING,
        typing
      };
    };

    /**
     * Action to set flag when user is viewing past messages in the chat
     * @param {Boolean} isViewing - Flag to set when user views past messages
     * @returns {Object} - Action
     */
    const setUserIsViewingPastMessages = (isViewing) => {
      return {
        type: ACTION_TYPES.SET_USER_VIEWING_PAST_MESSAGES,
        isViewing
      };
    };

    /**
     * Handle user scrolling through the chat window
     * @param {Boolean} userHasScrolledToPastConvs - Flag to set when user
     *                                               views past messages
     */
    const handleScrollPastExistingConversation = (userHasScrolledToPastConvs) => {
      const {dispatch, getState} = store;
      const {
        chatView: {
          unreadMessageIds
        }
      } = getState ();

      dispatch (
        setUserIsViewingPastMessages (userHasScrolledToPastConvs)
      );

      if (unreadMessageIds.length > 0 && userHasScrolledToPastConvs) {
        dispatch (markMessagesSeen ());
      }
    };

    /**
     * Action to create a message of given type along with
     * optionally showing system typing indicator.
     * Pass the message object related data in the config object,
     * and additional meta data in options object.
     * @param {object} config - Message config.
     * @param {String} config.type - Message type.
     * @param {Object} [config.messageConfig] - Data required for creating the message.
     * @param {String} [config.issueId] - The issue id to which issue belongs.
     * @param {Number} [config.typingTimer] - If the issue has to be added after sometime,
     *                                         pass the time in milliseconds. Typing indicator
     *                                         would be shown for that time period.
     * @param {Function} [config.onAddMessage] - The callback function to be executed when the
     *                                            message is added to the store.
     * @returns {Object} - Action
     */
    const createMessage = (config) => {
      return (dispatch) => {
        const {
          type: messageType,
          typingTimer = false,
          playAudio = false,
          messageConfig,
          onAddMessage
        } = config;
        const msg = messageHelpers.createMessage (messageType, messageConfig);

        // As this message is created on frontend, it is already in processed format.
        // So, directly add message in message list.
        const actionsToDispatch = [
          addMessages ({
            messages: [msg],
            process: false
          })
        ];

        if (typingTimer) {
          dispatch (toggleSystemTyping (true));

          if (systemTypingTimerId) {
            window.clearTimeout (systemTypingTimerId);
            systemTypingTimerId = null;
          }

          systemTypingTimerId = window.setTimeout (() => {
            dispatch (batchActions ([
              toggleSystemTyping (false),
              ...actionsToDispatch
            ]));
            if (onAddMessage) {
              onAddMessage (msg);
            }
            if (playAudio) {
              audioHelpers.playAudio (msg.isCustomerMsg);
            }
          }, typingTimer);
        } else {
          dispatch (batchActions (actionsToDispatch));
          if (onAddMessage) {
            onAddMessage (msg);
          }
          if (playAudio) {
            audioHelpers.playAudio (msg.isCustomerMsg);
          }
        }
      };
    };

    /**
     * Action to remove message
     * @param {String} messageId - message id to remove from message list
     * @returns {Object} - Action
     */
    const removeMessage = (messageId) => {
      return {
        type: ACTION_TYPES.REMOVE_MESSAGE,
        messageId
      };
    };

    /**
     * Action to create multiple attachment messages
     * @param {Object} files - Files List array like object
     */
    const createAttachmentMessages = (files) => {
      return (dispatch) => {
        // @TODO :- Add validation for
        // a) file extension
        const filesLength = files.length;

        dispatch (disableReplyBox ());
        // @NOTE :- Files is not an array but array like object
        for (let i = 0; i < filesLength; i++) {
          dispatch (createAttachmentMessage (files [i]));
        }
        // Timeout is used to avoid enabling replyBox in same update cycle
        // This provides async execution of enabling replyBox
        // Requirement :- Auto focus on text area after adding attachments
        window.setTimeout (() => {
          dispatch (enableReplyBox ());
        }, 0);
      };
    };

    /**
     * Upload an attachment
     * @param {Function} dispatch - dispatch
     * @param {Function} getState - get state
     * @param {Object} config - config containing file and attachmentMsgId
     * @property {Object} config.file - file object
     * @property {String} config.attachmentMsgId - attachment message id
     */
    const uploadAttachment = (config) => {
      return (dispatch, getState) => {
        const {
          appState: {
            domain,
            activeIssueId,
            issueState
          }
        } = getState ();
        const {file, attachmentMsgId} = config;
        const pluralIssueType = chatViewHelpers.getPluralizedIssueType (ISSUE_TYPE.ISSUE);

        upload ({
          route: routes.postUserReply (domain, activeIssueId, pluralIssueType),
          formData: xhrHelpers.getPreparedXhrData ({
            "issue-id": activeIssueId,
            "message-type": MESSAGE_TYPE.ATTACHMENT
          }, SKIP_PLATFORM_ID),
          file: file,
          headers: xhrHelpers.getCommonHeaders (),
          onSuccess: (response) => {
            // Remove the FE (dummy) attachment message from message list
            // Add new backend message in message list
            handleIssueReopen (issueState);
            dispatch (
              batchActions ([
                removeMessage (attachmentMsgId),
                addMessages ({
                  messages: [response]
                })
              ])
            );
            audioHelpers.playSend ();
          },
          onFailure: (response) => {
            dispatch (
              setAttachmentError (attachmentMsgId, response.errorCode)
            );
          }
        });
      };
    };

    /**
     * Create attachment message
     * @param {Object} file - File object
     * @param {String} [attachmentMsgId] - Attachment message id, will be present
     * in case of retry failed attachment
     * @returns {Function} - Action
     */
    const createAttachmentMessage = (file, attachmentMsgId) => {
      return (dispatch, getState) => {
        const state = getState ();
        const {appState} = state;
        const {activeIssueId} = appState;

        if (attachmentMsgId) {
          dispatch (
            uploadAttachment ({
              file,
              attachmentMsgId
            })
          );
        } else {
          // If attachmentMsgId is not present, create dummy issue first then
          // upload an attachment
          dispatch (
            createMessage ({
              type: MESSAGE_TYPE.ATTACHMENT,
              issueId: activeIssueId,
              messageConfig: {
                file
              },
              onAddMessage (msg) {
                attachmentMsgId = msg.id;
                // If attachment size is not valid, set error on message
                // Else upload the file
                if (!attachmentsHelpers.isAttachmentsSizeValid (msg.file.size)) {
                  dispatch (
                    setAttachmentError (attachmentMsgId, FILE_UPLOAD_ERRORS.SIZE_EXCEEDED)
                  );
                } else {
                  dispatch (
                    uploadAttachment ({
                      file,
                      attachmentMsgId
                    })
                  );
                }
              }
            })
          );
        }
      };
    };

    /**
     * Action to set attachment error
     * @param {String} messageId - message id of failed message
     * @param {Number} errorCode - file upload error code
     * @returns {Object} - Action
     */
    const setAttachmentError = (messageId, errorCode) => {
      return {
        type: ACTION_TYPES.SET_ATTACHMENT_ERROR,
        messageId,
        errorCode
      };
    };

    /**
     * Action to accept resolution question
     * @returns {Function} - Action
     */
    const acceptResolutionQuestion = () => {
      return (dispatch) => {
        postUserMessage ({
          msgBody: MESSAGE_BODY.SOLUTION_ACCEPTED,
          msgType: MESSAGE_TYPE.ACCEPTED,
          onSuccess: () => {
            dispatch (actionCreators.setResolutionQuestionCompleted (true));
            dispatch (showPostIssueResolutionFooter ());
          }
        });
      };
    };

    /**
     * Action to reject resolution question
     * @returns {Function} - Action
     */
    const rejectResolutionQuestion = () => {
      return (dispatch) => {
        postUserMessage ({
          msgBody: MESSAGE_BODY.SOLUTION_REJECTED,
          msgType: MESSAGE_TYPE.REJECTED,
          onSuccess: () => {
            dispatch (
              batchActions ([
                actionCreators.setResolutionQuestionCompleted (true),
                setChatViewFooter (ACTIVE_FOOTER.SOLUTION_REJECTED)
              ])
            );
          }
        });
      };
    };

    return {
      createPreIssue,
      updateReplyText,
      submitReply,
      startPollingForMessages,
      stopPollingForMessages,
      addMessages,
      setActiveIssueId,
      setChatViewFooter,
      updateIssueState,
      markMessagesSeen,
      handleScrollPastExistingConversation,
      switchToChatView,
      loadMoreMessages,
      createAttachmentMessages,
      createAttachmentMessage,
      showPostIssueResolutionFooter,
      setUserIsViewingPastMessages,
      acceptResolutionQuestion,
      rejectResolutionQuestion,
      setUserInputData,
      updateUserInputData,
      setUserSelectedOption,
      handleErrorAction
    };
  });
