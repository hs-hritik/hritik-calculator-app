/**
 * Chat view actions.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 12, 2017
 */

define("actions/chatView", [
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
  "actions/postSdkMessage",
  "helpers/message",
  "helpers/chatView",
  "helpers/xhr",
  "helpers/audio",
  "helpers/liveUpdates",
  "helpers/attachments",
  "helpers/analytics",
  "helpers/prepareProcessXhrData",
  "helpers/common",
  "utils/browser",
  "utils/upload",
  "extras/accessibility",
  "utils/debounceAction"
], function(
  store,
  ACTION_TYPES,
  routes,
  CHAT_VIEW_CONSTANTS,
  ACTIVE_VIEW,
  MESSAGE_CONSTANTS,
  APP_STATE_CONSTANTS,
  ERROR_CONSTANTS,
  analyticsConstants,
  xhr,
  arrayUtils,
  dateUtils,
  batchActions,
  actionCreators,
  postSdkMessage,
  messageHelpers,
  chatViewHelpers,
  xhrHelpers,
  audioHelpers,
  liveUpdatesHelpers,
  attachmentsHelpers,
  analyticsHelpers,
  prepareProcessXhrDataHelpers,
  commonHelpers,
  browserUtils,
  upload,
  ax,
  debounceAction
) {
  "use strict";

  const {
    TYPE: MESSAGE_TYPE,
    STATE: MESSAGES_STATE,
    BODY: MESSAGE_BODY,
    TEXT_INPUT_MESSAGE_TYPES,
    MESSAGE_ADD_EVENT_TYPES
  } = MESSAGE_CONSTANTS;

  const {
    ACTIVE_FOOTER,
    MESSAGES_POLLING_TIMEOUT,
    MESSAGES_FORCE_POLLING_TIMEOUT,
    CURSOR_TYPES,
    USER_REDACTION_ERR_MSG,
    USER_REDACTION_ERR_STATUS_CODE,
    INTENTS_SEARCH_DEBOUNCE_THRESHOLD
  } = CHAT_VIEW_CONSTANTS;

  const {getPreparedDeviceInfo} = prepareProcessXhrDataHelpers;

  const {FILE_UPLOAD_ERRORS, TYPE: ERROR_TYPES, RESPONSE_STATUS_CODE} = ERROR_CONSTANTS;

  const {
    ISSUE_STATE,
    ISSUE_TYPE,
    XHR_ISSUE_STATE,
    WEB_CHAT_VERSION,
    ALLOWED_EMPTY_POLLER_COUNT
  } = APP_STATE_CONSTANTS;

  const {EVENT} = analyticsConstants;

  const update = React.addons.update;

  const PROCESS = true;
  const ENABLE_FOOTER = true;
  const DISABLE_FOOTER = !ENABLE_FOOTER;

  let systemTypingTimerId = null,
    pollingEnabled = false,
    createPreissueXhr = null,
    fetchMessagesXhr = null,
    fetchMessagesTimer = null,
    lastFetchStartTime = null,
    lastFetchCompleted = false,
    lastPollerCallSucceeded = false,
    agentActivitySubscribed = false,
    emptyPollerCount = 0,
    markAsSeenXhrs = [];

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
   * Action to search intents.
   * @param {String} searchText - Search text (User input)
   * @returns {Object} - action
   */
  const searchIntents = (searchText) => {
    return {
      type: ACTION_TYPES.SEARCH_INTENTS,
      searchText
    };
  };

  /**
   * Async action to search intents
   * Note: Created async action just for triggering analytics event after updating
   * the search results. Ideally, it should be done in the analytics middleware.
   * But, the creation of analytics middleware isn't possible without revamp of
   * the existing events because of circular dependency of the store file.
   * @param {String} searchText - Search text (User input)
   * @returns {Function} - action
   */
  const asyncSearchIntents = (searchText) => {
    return (dispatch, getState) => {
      const searchingIntentsBeforeUpdate = getState().chatView.intents.isSearching;
      dispatch(searchIntents(searchText));
      const searchingIntentsAfterUpdate = getState().chatView.intents.isSearching;

      // Check if the search is cleared because the number of characters get reduced
      // We need to fire the search event if search gets cleared.
      if (searchingIntentsBeforeUpdate && !searchingIntentsAfterUpdate) {
        analyticsHelpers.track(EVENT.SEARCH_INTENTS, {
          searchIsCleared: true
        });
      }
    };
  };

  // Debounced search intents action
  const debouncedSearchIntents = debounceAction(
    asyncSearchIntents,
    INTENTS_SEARCH_DEBOUNCE_THRESHOLD
  );

  /**
   * This action updates the reply text, and search intents if applicable (based on the
   * issue state and the feature toggle)
   *
   * @param {String} value - New reply value.
   * @returns {Function} - action
   */
  const updateReplyTextAndSearchIntents = (value) => {
    return (dispatch, getState) => {
      dispatch(updateReplyText(value));

      const {appState} = getState();
      if (appState.issueType === ISSUE_TYPE.INITIAL && appState.featuresEnabled.intents) {
        dispatch(debouncedSearchIntents(value));
      }
    };
  };

  /**
   * Action to add messages in message list.
   * This action will push given messages to the issue's messages array.
   * @param {Object} config - config
   * @param {Array} config.messages - array of response messages
   * @param {Boolean} [config.process] - whether to process messages
   * @param {Boolean} [config.prepend] - whether to push messages at the start
   * @param {String} [config.responseType] - Type of response when addMessage is called
   * from success of add user reply XHR
   * @returns {Object} - action
   */
  const addMessages = (config) => {
    const {messages, process = true, prepend = false, responseType} = config;
    let processedMessages = messages;

    if (process) {
      processedMessages = messageHelpers.getProcessedMessages(messages);
    }

    if (prepend) {
      return {
        type: ACTION_TYPES.PREPEND_MESSAGES,
        messages: processedMessages
      };
    }

    return {
      type: ACTION_TYPES.APPEND_MESSAGES,
      messages: processedMessages,
      responseType
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
      window.clearInterval(fetchMessagesTimer);
      return;
    }

    if (lastFetchCompleted) {
      fetchMessages();
      return;
    }

    const timeSinceLastFetch = Date.now() - lastFetchStartTime;

    if (timeSinceLastFetch >= MESSAGES_FORCE_POLLING_TIMEOUT) {
      if (fetchMessagesXhr) {
        fetchMessagesXhr.abort();
        fetchMessagesXhr = null;
      }
      fetchMessages();
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

    liveUpdatesHelpers.openWsConnection();
    // Since the ws connection is asynchronous, this call to subscribe
    // to agent activity will go to the buffer and actual subscription
    // will take place when the web socket connection is completed.
    liveUpdatesHelpers.subscribeAgentActivityTopic();
    liveUpdatesHelpers.attachAgentActivityListener();

    agentActivitySubscribed = true;
  };

  /**
   * Start polling for messages.
   */
  const startPollingForMessages = () => {
    pollingEnabled = true;
    lastFetchCompleted = true;
    fetchMessages();
    fetchMessagesTimer = window.setInterval(_restartFetchMessages, MESSAGES_POLLING_TIMEOUT);
  };

  /**
   * Stop polling for messages.
   * Also clear previous timeout and xhr, if any.
   */
  const stopPollingForMessages = () => {
    if (!pollingEnabled) {
      return;
    }

    window.clearInterval(fetchMessagesTimer);

    if (fetchMessagesXhr) {
      fetchMessagesXhr.abort();
      fetchMessagesXhr = null;
    }

    pollingEnabled = false;

    liveUpdatesHelpers.unsubscribeAgentActivityTopic();
    liveUpdatesHelpers.detachAgentActivityListener();

    agentActivitySubscribed = false;
  };

  /**
   * Abort create preissue XHR if it's in progress
   */
  const abortCreatePreissueXhr = () => {
    // Check if preissue XHR is in progress. If so, abort it.
    if (createPreissueXhr) {
      createPreissueXhr.abort();
      createPreissueXhr = null;
    }
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
   * Action to update unread messages data
   * @param {Object} config
   * @param {Object[]} issues - array of unread issues
   * @param {string} issues[].type - type of issue (preIssue/issue)
   * @param {String[]} messageIds - array of unread message Ids
   * @returns {Object} - action
   */
  const updateUnreadMessagesData = (config) => {
    const {issues, messageIds} = config;
    return {
      type: ACTION_TYPES.UPDATE_UNREAD_MESSAGES_DATA,
      issues,
      messageIds
    };
  };

  /**
   * Action to represent mark messages as seen request init
   */
  const markMessagesSeenReqStart = () => {
    return {
      type: ACTION_TYPES.MARK_MESSAGES_SEEN_XHR_REQUEST
    };
  };

  /**
   * Action to represent mark messages as seen success
   * This action will clear out unread message ids and corresponding issue
   * data belonging to those messages from chat view reducer
   */
  const markMessagesSeenReqSuccess = () => {
    return {
      type: ACTION_TYPES.MARK_MESSAGES_SEEN_XHR_SUCCESS
    };
  };

  /**
   * Action to represent mark messages as seen end
   * @param {boolean} inProgress - whether xhr is in progress
   */
  const markMessagesSeenReqEnd = () => {
    return {
      type: ACTION_TYPES.MARK_MESSAGES_SEEN_XHR_END
    };
  };

  /**
   * Predicate to return all mark messages seen xhrs are completed
   * @returns {boolean} - whether all xhrs are completed
   */
  const areAllMarkMessagesAsSeenXhrCompleted = () => {
    return markAsSeenXhrs.every((req) => req.readyState === 4);
  };

  /**
   * Action to mark messages seen.
   * Also set the unread messages count to zero.
   * @returns {Object} - action
   */
  const markMessagesSeen = () => {
    return (dispatch, getState) => {
      // Do not fire read event if user has not seen
      // latest messages.
      if (!commonHelpers.areMessagesSeen()) {
        return;
      }

      const {
        appState: {domain, issueType},
        chatView: {unreadMessageIds, unreadIssues, markMessageAsSeenXhrIsInProgress}
      } = getState();

      // Don't fire the XHR if:
      // a] Issue type is initial i.e. not preissue or issue
      // b] Mark message seen xhr is in progress
      //    There are multiple valid places which call this action and we want
      //    to avoid multiple unnecessary backend calls.
      if (issueType === ISSUE_TYPE.INITIAL || markMessageAsSeenXhrIsInProgress) {
        return;
      }

      dispatch(markMessagesSeenReqStart());

      // Loop on all the issues (preIssue + issue) which have unread messages
      // Mark all message for that issue as seen by user.
      // Format of unreadIssues is {"3001": "preissue", "3002": "issue"}
      // More info: https://helpshift.atlassian.net/browse/FRON-3731
      Object.keys(unreadIssues).forEach((issueId, index) => {
        const unreadIssueType = unreadIssues[issueId];
        const pluralIssueType = chatViewHelpers.getPluralizedIssueType(unreadIssueType);

        markAsSeenXhrs[index] = xhr({
          route: routes.putMessages(domain, issueId, pluralIssueType),
          data: xhrHelpers.getPreparedXhrData(
            {
              md_state: "read"
            },
            {
              skipPlatformId: true
            }
          ),
          method: "PUT",
          headers: xhrHelpers.getCommonHeaders(),
          onSuccess: () => {
            const allXhrsCompleted = areAllMarkMessagesAsSeenXhrCompleted();
            if (unreadMessageIds.length !== 0 && allXhrsCompleted) {
              dispatch(markMessagesSeenReqSuccess());
              dispatch(postSdkMessage.updateUnreadCount(0));
            }
          },
          onEnd: () => {
            // Check if every xhr is completed then make xhr in progress as false
            if (areAllMarkMessagesAsSeenXhrCompleted()) {
              dispatch(markMessagesSeenReqEnd());
              markAsSeenXhrs = [];
            }
          }
        });
      });
    };
  };

  /**
   * Action to switch to chat view.
   * Also mark messages seen if there are any unread messages.
   * @returns {Function} - action
   */
  const switchToChatView = () => {
    return (dispatch) => {
      store.dispatch(markMessagesSeen());
      ax.setFlatListActiveIndex(0);
      dispatch(actionCreators.updateActiveView(ACTIVE_VIEW.CHAT));
    };
  };

  /**
   * Handles post chat feature steps
   * Marks post chat steps as completed depending on the config
   */
  const handlePostChatFeatureSteps = () => {
    const {dispatch, getState} = store;
    const {
      chatView: {isCsatSubmitted}
    } = getState();
    const lastMessageType = getLatestMessage().type;
    const actionsToDispatch = [];

    // If type of last message in message list is either accepted or rejected by user,
    // set resolution question step as completed
    if (lastMessageType === MESSAGE_TYPE.ACCEPTED || lastMessageType === MESSAGE_TYPE.REJECTED) {
      actionsToDispatch.push(actionCreators.setResolutionQuestionCompleted(true));
    }

    // If csat rating is submitted by the user, set csat step as completed
    if (isCsatSubmitted) {
      actionsToDispatch.push(actionCreators.setCsatCompleted());
    }

    dispatch(batchActions(actionsToDispatch));
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
   * @param {boolean} userIsRedacted - true if the user has to be redacted
   * @returns {Object} - Action
   */
  const setUserIsRedacted = (userIsRedacted) => {
    return {
      type: ACTION_TYPES.SET_USER_IS_REDACTED,
      userIsRedacted
    };
  };

  /**
   * Action to reset user input
   * This will reset label, errors, placeholders etc of user input
   * @returns {Object} - Action
   */
  const resetUserInput = () => {
    return {
      type: ACTION_TYPES.RESET_USER_INPUT_DATA
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
   * Action to set flag when loading more messages (when the user scrolls up) fails
   * @param {Boolean} loadingMoreMsgsHasFailed - flag to denote if loading more messages
   *                                             has failed
   * @returns {Object} - action
   */
  const setLoadingMoreMsgsFailed = (loadingMoreMsgsHasFailed) => {
    return {
      type: ACTION_TYPES.SET_LOADING_MORE_MSGS_FAILED,
      loadingMoreMsgsHasFailed
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
    const {dispatch, getState} = store;
    const {
      appState: {issueType}
    } = getState();

    // If bot message does not contain any input, don't process it and hide
    // the footer.
    // This is to handle bot info text messages which do not have input.
    // If the issue type is preIssue, then hide footer and show TAI.
    // If the issue type is issue, then
    //   a. explicitly enable the footer
    //   b. hide TAI
    //   c. reset user input to default.

    if (!input) {
      if (issueType === ISSUE_TYPE.PRE_ISSUE) {
        handleIssueFooterAndTAI(DISABLE_FOOTER);
      } else {
        handleIssueFooterAndTAI(ENABLE_FOOTER);
        dispatch(resetUserInput());
      }
      return;
    }

    const {type} = message;
    const processedUserInput = chatViewHelpers.getProcessedUserInput({
      messageType: type,
      input
    });

    dispatch(
      batchActions([
        // Set processed user input and save it in store
        setUserInputData(processedUserInput),
        // Set footer type as reply because this is bot step, we accept some user input
        setChatViewFooter(ACTIVE_FOOTER.REPLY)
      ])
    );

    // Once bot input is processed, show the footer
    handleIssueFooterAndTAI(ENABLE_FOOTER);
  };

  /**
   * Handle latest message for bot actions and bot input and take actions
   * @param {Object} latestMessage - latest message in message list
   */
  const handleLatestMessage = (latestMessage) => {
    const {dispatch} = store;
    const {type, has_next_bot: hasNextBot} = latestMessage;

    switch (type) {
      case MESSAGE_TYPE.BOT_STARTED:
        // If the last message in poller is bot start
        // a] hide the footer
        handleIssueFooterAndTAI(DISABLE_FOOTER);
        break;

      case MESSAGE_TYPE.BOT_ENDED:
        // If the last message in poller is bot end
        // a] reset previous user input data and
        // b] depending on whether next step is bot, hide or show the footer
        dispatch(resetUserInput());
        if (hasNextBot) {
          handleIssueFooterAndTAI(DISABLE_FOOTER);
        } else {
          handleIssueFooterAndTAI(ENABLE_FOOTER);
        }
        break;
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
   * Action to set latest conversation has been loaded
   * @returns {Object} - Action
   */
  const setLatestConversationHasLoaded = () => {
    return {
      type: ACTION_TYPES.SET_LATEST_CONVERSATION_HAS_LOADED
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
    const conversationStartDateMessage = messageHelpers.createMessage(MESSAGE_TYPE.CHAT_SEPARATOR, {
      hr,
      timestamp: dateUtils.format(timestamp, "{dddd}, {mmmm} {dd}, {yyyy}")
    });

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
      if (issue.type === ISSUE_TYPE.PRE_ISSUE && issue.preissue_id === preIssueId) {
        return i;
      }
    }

    return -1;
  };

  /**
   * Create a linear message list from issue list
   * @param {Object} issues - Issue List
   * @param {String} config.lastGroupId - ID of the last pre-issue in the list
   * @param {String} config.hasOlderMsgs - Flag to determine if there are more messages
   *                                       left to be rendered.
   * @returns {Array} Array of messages
   */
  const getLinearMessages = (issues, config) => {
    const finalMessages = [];
    const {hasOlderMsgs} = config;

    let previousGroupId = config.lastGroupId;
    let redactionCount = 0;

    issues.forEach((issue) => {
      const currentGroupId = issue.preissue_id;

      // Count the number of redacted issues in succession.
      // Essentially, we want to show "5 Conversations Redacted"
      // when there are 5 conversations redacted in a row.
      if (issue.redacted) {
        redactionCount++;
        return;
      }

      // If there has been transition from one issue to another
      // insert a date separator.
      //
      // Since issues are received with the latest issue at the top and the
      // oldest at the last, we create the right rendering order by using unshift
      if (previousGroupId && currentGroupId !== previousGroupId) {
        finalMessages.unshift(_getIssueDateSeparator(issue.created_at));
      }

      // Render a redaction message with redaction count.
      if (redactionCount) {
        finalMessages.unshift(
          messageHelpers.createMessage(MESSAGE_TYPE.CONVERSATION_REDACTED, {
            redactionCount
          })
        );
        redactionCount = 0;
      }

      previousGroupId = currentGroupId;
      finalMessages.unshift(...issue.messages);
    });

    // Render redaction message for remaining conversations
    // Note: Conversation redaction message doesn't need to be rendered
    // if it's the last conversation - hence hasOlderMsgs check.
    if (redactionCount && hasOlderMsgs) {
      const createdAt = issues[issues.length - 1].created_at;

      finalMessages.unshift(_getIssueDateSeparator(createdAt));
      finalMessages.unshift(
        messageHelpers.createMessage(MESSAGE_TYPE.CONVERSATION_REDACTED, {
          redactionCount
        })
      );
    }

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
    const clonedIssueList = issueList.map((issue) => {
      return update(issue, {});
    });
    const finalIssueList = [];

    for (let i = 0; i < clonedIssueList.length; i++) {
      const issue = clonedIssueList[i];

      if (issue.processed) {
        continue;
      }

      finalIssueList.push(issue);
      issue.processed = true;

      if (issue.type === ISSUE_TYPE.ISSUE) {
        // Find preIssue in the list and add it to final list
        const preIssueIndex = _getPreIssueIndex(clonedIssueList, issue.preissue_id);
        const preIssue = preIssueIndex !== -1 ? clonedIssueList[preIssueIndex] : null;

        // Check if the issue has already been processed in the preceding step
        if (preIssue && !preIssue.processed) {
          preIssue.processed = true;
          finalIssueList.push(preIssue);
        }
      }
    }

    return finalIssueList;
  };

  /**
   * Get the latest issue and its preissue.
   * @param {Array} issues - List of issues
   * @returns {Array}
   */
  const getLatestConversation = (issues) => {
    const currentIssue = issues[0];
    let previousIssue = null;

    // If current issue type is 'issue', find pre issue from issues list
    // and save it in previous
    if (currentIssue && currentIssue.type === ISSUE_TYPE.ISSUE) {
      previousIssue = arrayUtils.find(issues, (issue) => {
        return (
          issue.type === ISSUE_TYPE.PRE_ISSUE && issue.preissue_id === currentIssue.preissue_id
        );
      });
    }

    return previousIssue ? [currentIssue, previousIssue] : [currentIssue];
  };

  /**
   * Predicate to return if all messages of latest conversation have loaded
   * @param {Array} issues - List of issues
   * @returns {Boolean}
   */
  const hasLatestConversationLoaded = (config) => {
    const {issues, conversationHistoryEnabled, hasOlderMsgs} = config;

    const oldestIssue = issues[issues.length - 1];
    const latestIssue = issues[0];

    // When conversationHistory is enabled, hasOlderMsgs would tell
    // us if the conversation has ended.
    if (conversationHistoryEnabled) {
      return hasOlderMsgs === false;
    }

    // Here, we compare oldest and newest issue to see if there are
    // more than two issues. If their group ids are same, it means that
    // there's only one issue; if they are different, there is more than one.
    //
    // In case when there's only one issue in the issueList, hasOlderMsgs would
    // tell us if the latest conversation has loaded.
    return oldestIssue.preissue_id !== latestIssue.preissue_id || hasOlderMsgs === false;
  };

  /**
   * Function to create a linear message list to be rendered
   * from the list of issues.
   * @param {Array} issueList - List of issues that have come in XHR response
   * @param {String} config.lastIssueId - Last issue ID rendered in the message list
   * @param {Boolean} config.hasOlderMsgs - Flag to determine if there are more messages
   *                                        left to be rendered.
   * @param {Boolean} config.conversationHistoryEnabled - Whether conversation history
   *                                                      feature is enabled
   * @returns {Array} List of messages
   */
  const createLinearMessageList = (issueList, config) => {
    const {lastGroupId, hasOlderMsgs, conversationHistoryEnabled} = config;

    const orderedIssues = getOrderedIssueList(issueList);
    const issuesToRender = conversationHistoryEnabled
      ? orderedIssues
      : getLatestConversation(orderedIssues);
    const linearMsgList = getLinearMessages(issuesToRender, {
      hasOlderMsgs,
      lastGroupId
    });
    const latestConvHasLoaded = hasLatestConversationLoaded({
      issues: issueList,
      hasOlderMsgs,
      conversationHistoryEnabled
    });

    if (!linearMsgList.length) {
      return [];
    }

    // if there are no more messages remaining to be fetched, we should
    // render the timestamp without a <hr> at the top of list
    if (latestConvHasLoaded) {
      const oldestIssue = issueList[issueList.length - 1];

      linearMsgList.unshift(_getIssueDateSeparator(oldestIssue.created_at, false));
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
      chatView: {issueCursor},
      appState: {
        fullPrivacyEnabled,
        featuresEnabled: {conversationHistory: conversationHistoryEnabled}
      }
    } = store.getState();
    const {issues, hasOlderMsgs} = config;
    const latestConversation = getLatestConversation(issues);
    const currentIssue = latestConversation[0];
    const previousIssue = latestConversation[1];

    let messages = [];

    messages = createLinearMessageList(issues, {
      lastIssueId: null,
      conversationHistoryEnabled: conversationHistoryEnabled && !fullPrivacyEnabled,
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
      analyticsHelpers.track(EVENT.ISSUE_CREATED, {
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
      ui: {text}
    } = getState();
    const conversationClosedMsg = conversationHasEnded ? text.conversationClosed : "";

    dispatch(setChatViewFooter(ACTIVE_FOOTER.START_NEW_CONVERSATION));

    // Show system info message - This conversation has ended.
    dispatch(
      createMessage({
        type: MESSAGE_TYPE.CHAT_SEPARATOR,
        messageConfig: {
          infoText: conversationClosedMsg,
          hr: true
        }
      })
    );
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
        issueState,
        featuresEnabled: {resolutionQuestion: resolutionQuestionEnabled}
      },
      chatView: {issueCursor}
    } = getState();

    let conversationEndEventShouldTrigger = false;

    // Do not handle active state as we will wait for user input/bot steps
    if (issueState === ISSUE_STATE.ACTIVE) {
      return;
    }

    // We get agent typing indicator from websocket, but issue is resolved by
    // poller. The TAI keeps showing for few seconds which is pre-defined behaviour.
    dispatch(actionCreators.toggleAgentTyping(false));

    if (issueState === ISSUE_STATE.RESOLVED) {
      // We have to explicitly enable footer when issue is resolved.
      // Reason being, for preIssue we wait only for bot step (according to design).
      // So when issue is deflected i.e user accepts faq suggestion, the footer is
      // hidden and user will not be able to see 'Start new conversation' button.
      handleIssueFooterAndTAI(ENABLE_FOOTER);

      // If issue type is 'issue'
      // a. handle post chat features
      // b. show post issue resolution footer (resolution question | csat |
      //    start new conversation)
      // Else if issue type is 'preissue' then handle end chat
      if (issueType === ISSUE_TYPE.ISSUE) {
        handlePostChatFeatureSteps();
        dispatch(showPostIssueResolutionFooter());
      } else if (issueType === ISSUE_TYPE.PRE_ISSUE) {
        // If preIssue is resolved i.e. user has accepted faq suggestions, then
        // provide an option to start new conversation
        handleChatEnd({
          conversationHasEnded: false
        });

        conversationEndEventShouldTrigger = true;
      }
    } else if (issueState === ISSUE_STATE.REJECTED) {
      // Show "Conversation Closed" message and "Start a new conversation"
      // button when the issue is rejected
      handleChatEnd({
        conversationHasEnded: true
      });
    }

    // We don't want to retrigger these events when the page is
    // refreshed. Since, issueCursor would not be 0 when messages are fetched
    // just after conversation has ended, but will be when messages are fetched
    // from the start, we use it as a check.
    if (issueCursor) {
      if (issueState === ISSUE_STATE.RESOLVED) {
        dispatch(postSdkMessage.conversationResolvedEvent());
      } else if (issueState === ISSUE_STATE.REJECTED) {
        dispatch(postSdkMessage.conversationRejectedEvent());
      }

      if (!resolutionQuestionEnabled || conversationEndEventShouldTrigger) {
        dispatch(postSdkMessage.conversationEndEvent());
      }
    }
  };

  /**
   * Predicate to return whether issue is active
   * @param {String} issueState - state of issue
   */
  const isIssueActive = (issueState) => {
    return chatViewHelpers.getProcessedIssueState(issueState) === ISSUE_STATE.ACTIVE;
  };

  /**
   * Action to save bot step message
   * @param {Object} message - message object
   * @returns {Object} - Action
   */
  const saveBotStepMessage = (message) => {
    return {
      type: ACTION_TYPES.SAVE_BOT_STEP_MESSAGE,
      message
    };
  };

  /**
   * Action to set bot step in progress
   * @param {Boolean} inProgress - whether bot step is in progress
   * @returns {Object} - Action
   */
  const setBotStepInProgress = (inProgress) => {
    return {
      type: ACTION_TYPES.SET_BOT_STEP_IN_PROGRESS,
      inProgress
    };
  };

  /**
   * Function to save latest bot step in store and processes the latest bot input
   * @param {Array} messages - list of unprocessed messages
   */
  const saveLatestBotStepAndProcessBotInput = (messages) => {
    const {dispatch, getState} = store;
    const msgsLength = messages.length;

    // Reverse loop on list of messages to see if there is any bot message.
    // If we find any bot message, we will save that message in store and use
    // the message input to render footer.
    for (let i = msgsLength - 1; i >= 0; i--) {
      const msg = messages[i];
      const {type, isSystemMsg} = msg;

      // isBotMessage will also handle the case where we get a non bot message
      // and it's not supported. For non bot message which is not supported, we
      // will not post bot cancel message.
      if (!isSystemMsg && messageHelpers.isBotMessage(msg)) {
        const botMsgIsNotSupported = !messageHelpers.isMessageTypeSupported(type);
        const botStepIsInProgress = botMsgIsNotSupported || messageHelpers.isBotStepMessage(type);
        dispatch(
          batchActions([
            // Bot step message contains all bot type message except bot control
            // messages i.e bot_start and bot_end
            setBotStepInProgress(botStepIsInProgress),
            saveBotStepMessage(messageHelpers.getProcessedMessage(msg))
          ])
        );

        handleMessageInput(msg);

        if (botMsgIsNotSupported) {
          postUserMessage();
        }

        return;
      }
    }

    // At this point, all the messages have been parsed and no bot message was
    // encountered. In order to counter any unknown bug during the preissue state
    // disable the footer so that the end user isn't able to send a message that
    // doesn't correspond to a bot message during preissue.

    // After preIssue optimization, if there are no bots running on preIssue,
    // backend directly creates an issue. So in this case we have to re-enable the
    // footer if issue type is issue.
    const {
      appState: {issueType}
    } = getState();

    if (issueType === ISSUE_TYPE.PRE_ISSUE) {
      handleIssueFooterAndTAI(DISABLE_FOOTER);
    } else if (issueType === ISSUE_TYPE.ISSUE) {
      handleIssueFooterAndTAI(ENABLE_FOOTER);
    }
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
        sdkConfigOptions: {initialUserMessage},
        minimized
      }
    } = getState();

    if (initialUserMessage && !minimized) {
      dispatch(createPreIssue());
      preIssueActionTriggered = true;
    }

    return preIssueActionTriggered;
  };

  /**
   * Checks if all the conversation have been redacted and
   * creates a new preIssue + stops polling when they have been.
   * @param {Object} config - conversation redaction config.
   * @param {Array} config.issue - array of issues
   * @param {Object} config.issueCursor - used to check if it's the first
   *                                      fetch call
   * @returns {Boolean} - whether all the conversations have been redacted
   */
  const handleAllConversationsRedaction = (config) => {
    const {dispatch} = store;
    const {issues, issueCursor} = config;

    const issueListHasNonRedactedIssue = issues.some((issue) => !issue.redacted);

    // If all the conversations have been redacted there would
    // be no messages and we should start conversation anew.
    if (!issueListHasNonRedactedIssue && !issueCursor) {
      stopPollingForMessages();
      dispatch(createPreIssue());
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
    const {issue, cursorType, cursorTs} = messageCursorConfig;

    if (cursorType === CURSOR_TYPES.FORWARD) {
      dispatch(
        setActiveIssueMsgCursor({
          cursorType,
          cursorTs,
          issueType: issue.type,
          issueId: _getIssueId(issue)
        })
      );
    } else {
      const oldestIssueMessages = issue.messages;

      // If the issue is redacted, then it might have an empty
      // list of messages
      const oldestTimestamp = oldestIssueMessages[0]
        ? oldestIssueMessages[0].created_at
        : issue.created_at;

      dispatch(
        setActiveIssueMsgCursor({
          cursorType,
          cursorTs: oldestTimestamp,
          issueType: issue.type,
          preissueId: issue.preissue_id,
          issueId: _getIssueId(issue)
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
        sdkConfigOptions: {initialUserMessage}
      }
    } = getState();

    // If message type is accept first user message (EMPTY_MSG_WITH_TEXT_INPUT)
    // and initialUserMessage is set through api, do not wait for user input
    // Directly send the message as bot response
    // We reset initial user message once it's passed to bot as we do not want
    // to reuse same message for more than one conversation.
    if (messageType === MESSAGE_TYPE.EMPTY_MSG_WITH_TEXT_INPUT && initialUserMessage) {
      dispatch(
        batchActions([updateReplyText(initialUserMessage), actionCreators.setInitialUserMsg("")])
      );

      postUserMessage();
    }
  };

  /**
   * Handle reset initial user message
   * If the initial user message api is called during on going conversation
   * then reset the user message.
   * @param {Object} config
   * @param {Number} config.issueCursor - issue cursor
   * @param {Boolean} config.issueIsActive - whether current issue or preIssue active
   * @param {Boolean} config.isPreIssue - whether current issue type is preIssue
   */
  const handleResetInitialUserMessage = (config) => {
    const {dispatch, getState} = store;
    const {
      appState: {
        sdkConfigOptions: {initialUserMessage}
      }
    } = getState();
    const {issueCursor, issueIsActive, isPreIssue} = config;

    // Clear user message set through api if
    // a] This is the first poller call.
    //    (Here we are assuming the developer has called the api before the poller)
    // b] If issue type is not preIssue
    // c] Issue is active (not resolved or rejected)
    // d] And developer has set initial user message
    if (!issueCursor && !isPreIssue && issueIsActive && initialUserMessage) {
      dispatch(actionCreators.setInitialUserMsg(""));
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
        domain,
        fullPrivacyEnabled,
        featuresEnabled: {conversationHistory: conversationHistoryEnabled},
        issueType
      },
      chatView: {
        messageCursor: {
          [CURSOR_TYPES.BACKWARD]: {
            value: cursorTs,
            meta: {issueType: messageCursorIssueType, preIssueId, issueId}
          }
        },
        pastConversationsLoading
      }
    } = getState();

    // Return if issue type is initial, or if messages are already being loaded.
    if (issueType === ISSUE_TYPE.INITIAL || pastConversationsLoading) {
      return;
    }

    const isIssue = messageCursorIssueType === ISSUE_TYPE.ISSUE;
    const xhrData = {
      cursor: cursorTs
    };

    if (isIssue) {
      xhrData.issue_id = issueId;
    } else {
      xhrData.preissue_id = issueId;
    }

    dispatch(toggleConversationsLoader(true));

    xhr({
      route: routes.getConversationHistory(domain),
      data: xhrHelpers.getPreparedXhrData(xhrData),
      method: "POST",
      headers: xhrHelpers.getCommonHeaders(),
      onSuccess: (response) => {
        const {issues, has_older_messages: hasOlderMsgs} = response;

        if (!issues.length) {
          return;
        }

        const linearMsgs = createLinearMessageList(issues, {
          lastGroupId: preIssueId,
          hasOlderMsgs,
          conversationHistoryEnabled: conversationHistoryEnabled && !fullPrivacyEnabled
        });

        handleSettingLatestConversationLoadStatus({
          hasOlderMsgs,
          conversationHistoryEnabled: conversationHistoryEnabled && !fullPrivacyEnabled,
          issues
        });

        const oldestIssue = issues[issues.length - 1];

        dispatch(
          batchActions([
            setLoadingMoreMsgsFailed(false),
            addMessages({
              messages: linearMsgs,
              prepend: true
            }),
            setAllMessagesAreLoaded(!hasOlderMsgs)
          ])
        );

        saveMessageCursor({
          issue: oldestIssue,
          cursorType: CURSOR_TYPES.BACKWARD
        });
      },

      onFailure: () => {
        dispatch(setLoadingMoreMsgsFailed(true));
      },

      onEnd: () => {
        dispatch(toggleConversationsLoader(false));
      }
    });
  };

  /**
   * Set the flag in store when conversation history is disabled
   * and all the messages have been loaded.
   * @param {Boolean} config.conversationHistoryEnabled - Whether conversation history
   *                                                      feature is enabled
   * @param {Boolean} config.hasOlderMsgs - Whether more messages need to be loaded
   * @param {Array} config.issues - List of issues
   */
  const handleSettingLatestConversationLoadStatus = (config) => {
    const {dispatch} = store;

    if (hasLatestConversationLoaded(config)) {
      dispatch(setLatestConversationHasLoaded());
    }
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
        fullPrivacyEnabled,
        featuresEnabled: {conversationHistory: conversationHistoryEnabled},
        issueType: previousIssueType
      },
      chatView: {
        messageCursor: {forward: forwardMessageCursor},
        issueCursor,
        pollerFailureCount: prevPollerFailureCount,
        userIsRedacted,
        localGreetingMessageId
      }
    } = store.getState();

    const xhrData = {};
    const {
      meta: {issueId: forwardMsgIssueId, issueType}
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

    lastFetchStartTime = Date.now();
    lastFetchCompleted = false;

    fetchMessagesXhr = xhr({
      route: routes.getConversationUpdates(domain),
      data: xhrHelpers.getPreparedXhrData(xhrData),
      method: "POST",
      headers: xhrHelpers.getCommonHeaders(),
      onSuccess: (response) => {
        // @NOTE - This is to make sure that onEnd is called even if
        // any code in onSuccess results in an Exception.
        try {
          // Undo updates when the poller fails
          // 1. Poller succeeded
          // Refer onEnd callback where this value is used.
          lastPollerCallSucceeded = true;

          // 2. If the poller succeeds, it means that it's a valid user. If
          // the user was set to be redacted with the previous poller
          // failure, undo it.
          // Refer the onFailure callback where the user is redacted.
          if (userIsRedacted) {
            dispatch(setUserIsRedacted(false));
          }

          const {has_older_messages: hasOlderMsgs, issues = [], cursor} = response;

          if (!issues.length) {
            // If cursor is empty then only increment empty poller count.
            // Empty cursor means we have not received any issues data from
            // the poller
            if (!cursor) {
              const {
                appState: {minimized}
              } = store.getState();

              emptyPollerCount++;

              // Create a new preIssue if
              // 1. Empty poller count is greater than allowed empty poller count
              // 2. Widget is open
              // Ref: ONCALL-3288 - This is to handle the case of issue redaction
              // where issue_exists is true but issues list is empty.
              if (emptyPollerCount >= ALLOWED_EMPTY_POLLER_COUNT && !minimized) {
                dispatch(createPreIssue());
                emptyPollerCount = 0;
              }
            }
            return;
          }

          // Set the flag only in the first fetch call
          if (!issueCursor) {
            handleSettingLatestConversationLoadStatus({
              hasOlderMsgs,
              conversationHistoryEnabled: conversationHistoryEnabled && !fullPrivacyEnabled,
              issues
            });
          }

          const conversationsRedacted = handleAllConversationsRedaction({
            issues,
            issueCursor
          });

          if (conversationsRedacted) {
            return;
          }

          const {currentIssue, messages} = getCurrentIssueAndMessages({issues, hasOlderMsgs});

          const {
            publish_id: issueId,
            type: currentIssueType,
            state_data: {state: issueState},
            csat_received: isCsatSubmitted
          } = currentIssue;

          const isPreIssue = currentIssueType === ISSUE_TYPE.PRE_ISSUE;
          const internalIssueId = _getIssueId(currentIssue);
          const issueIsActive = isIssueActive(issueState);

          dispatch(
            postSdkMessage.conversationStatusEvent({
              open: issueIsActive
            })
          );

          handleResetInitialUserMessage({
            issueCursor,
            issueIsActive,
            isPreIssue
          });

          if (!issueIsActive) {
            stopPollingForMessages();

            const preIssueActionTriggered = handleCreatePreIssueForInitialUserMessage({
              issueCursor
            });

            if (preIssueActionTriggered) {
              return;
            }
          }

          handlePreIssueToIssueConversion({
            currentIssueType,
            previousIssueType
          });

          dispatch(
            batchActions([
              // We stop loading after the first response from poller because
              // we want to show loader until we get the first message from the backend
              actionCreators.toggleChatViewLoading(false),
              setActiveIssueId(issueId),
              actionCreators.setInternalIssueId(internalIssueId),
              setCsatSubmitted(isCsatSubmitted),
              updateIssueState(issueState, PROCESS),
              updateIssueType(currentIssueType)
            ])
          );

          if (!isPreIssue) {
            handleAgentLiveUpdates();
          }

          const messagesLength = messages.length;
          if (messagesLength) {
            const latestMessage = messages[messagesLength - 1];
            const processedMessages = messageHelpers.getProcessedMessages(messages);

            handleLatestMessage(latestMessage);
            saveLatestBotStepAndProcessBotInput(messages);

            dispatch(
              addMessages({
                messages: processedMessages,
                process: false
              })
            );

            if (localGreetingMessageId) {
              dispatch(removeMessage(localGreetingMessageId));
            }

            saveMessageCursor({
              issue: currentIssue,
              cursorTs: cursor,
              cursorType: CURSOR_TYPES.FORWARD
            });

            // Only set the backward cursor when initial issues are being
            // fetched, not when updates for issues are being received.
            // Also, remove the greeting message added by the client side logic
            // (local greeting message) with the first poller response.
            // Note: This works because issueCursor is not set before
            // the first call.
            if (!issueCursor) {
              const oldestIssue = issues[issues.length - 1];

              dispatch(setAllMessagesAreLoaded(!hasOlderMsgs));

              saveMessageCursor({
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
              handleSubmitInitialUserMessage(latestMessage.type);
            }

            handleUnreadMessages({
              messages: processedMessages,
              issues
            });
          }

          handleIssueState();

          dispatch(setIssueCursor(cursor));
        } catch (ex) {
          // @TODO - Ideally, this exception should be logged to server.
          // eslint-disable-next-line
            console.error ("Something went wrong = ", ex);
        }
      },
      onFailure: (request, statusCode) => {
        let response;

        try {
          response = JSON.parse(request.response);
        } catch (e) {
          return;
        }

        if (
          response.msg === USER_REDACTION_ERR_MSG &&
          statusCode === USER_REDACTION_ERR_STATUS_CODE
        ) {
          dispatch(setUserIsRedacted(true));
        }
      },
      onEnd: () => {
        const newPollerFailureCount = lastPollerCallSucceeded ? 0 : prevPollerFailureCount + 1;

        if (newPollerFailureCount !== prevPollerFailureCount) {
          dispatch(setPollerFailureCount(newPollerFailureCount));
        }

        lastFetchCompleted = true;
        lastPollerCallSucceeded = false;
      }
    });
  };

  /**
   * Handle TAI and enabling of chat footer
   * @param {Boolean} footerIsEnabled - whether to enable the footer
   * When footer is enabled, TAI will be hidden
   * When footer is disabled, TAI will be displayed
   * If footerIsEnabled is passed as false then :
   * In case of preIssue - footer will hide
   * In case of issue - footer will be displayed but disabled
   */
  const handleIssueFooterAndTAI = (footerIsEnabled) => {
    const {dispatch} = store;

    if (footerIsEnabled) {
      dispatch(batchActions([enableReplyBox(), toggleSystemTyping(false)]));
    } else {
      dispatch(batchActions([disableReplyBox(), toggleSystemTyping(true)]));
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
    const preIssueConvertedToIssue =
      previousIssueType === ISSUE_TYPE.PRE_ISSUE && currentIssueType === ISSUE_TYPE.ISSUE;

    // If preIssue is converted to issue then reset user input and show footer
    // Also reset initial user message
    if (preIssueConvertedToIssue) {
      dispatch(batchActions([actionCreators.setInitialUserMsg(""), resetUserInput()]));
      handleIssueFooterAndTAI(ENABLE_FOOTER);
    }
  };

  /**
   * Handle unread messages
   * Calculate unread (agent) message count by checking each message
   * If the widget is minimized, post message to parent with unread count which
   * will show unread notification on widget
   * @param {Object} config
   * @param {Array} config.messages - processed poller messages
   * @param {Array} config.issues - raw poller issues
   */
  const handleUnreadMessages = (config) => {
    const {dispatch, getState} = store;
    const {
      chatView: {unreadMessageIds, issueCursor}
    } = getState();
    const {messages, issues} = config;
    const unreadIssuesMap = {};
    const newUnreadMessageIds = [];

    // Calculate unread count for agent messages only
    messages.forEach((msg) => {
      const {id, type, state, isCustomerMsg, isSystemMsg} = msg;

      if (
        !isCustomerMsg &&
        !isSystemMsg &&
        state !== MESSAGES_STATE.READ &&
        messageHelpers.isRenderableMessage(type)
      ) {
        newUnreadMessageIds.push(id);
      }
    });

    // Find corresponding issue ids and type for unread messages
    issues.forEach((issue) => {
      issue.messages.forEach((msg) => {
        if (newUnreadMessageIds.indexOf(msg.id) !== -1) {
          // As multiple unread messages can belong to same issue,
          // storing data in map is better as we don't have to dedupe it
          unreadIssuesMap[issue.publish_id] = issue.type;
        }
      });
    });

    if (commonHelpers.areMessagesSeen()) {
      dispatch(markMessagesSeen());
    } else {
      dispatch(
        updateUnreadMessagesData({
          messageIds: newUnreadMessageIds,
          issues: unreadIssuesMap
        })
      );
      dispatch(
        postSdkMessage.updateUnreadCount(newUnreadMessageIds.length + unreadMessageIds.length)
      );
    }

    // Do not play sound on page load even if there are unread messages
    if (issueCursor && newUnreadMessageIds.length) {
      audioHelpers.playReceive();
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
          postChatFeatures: {resolutionQuestionCompleted, csatCompleted},
          featuresEnabled: {resolutionQuestion: resolutionQuestionEnabled, csatBot: csatBotEnabled}
        }
      } = getState();

      if (resolutionQuestionEnabled && !resolutionQuestionCompleted) {
        dispatch(setChatViewFooter(ACTIVE_FOOTER.CONVERSATION_RESOLUTION_QUESTION));
      } else if (csatBotEnabled && !csatCompleted) {
        dispatch(setChatViewFooter(ACTIVE_FOOTER.CSAT));
        // Track the CSAT requested event.
        analyticsHelpers.track(EVENT.CSAT, {
          event: EVENT.CSAT_REQUESTED
        });
      } else {
        handleChatEnd({
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
  const postUserMessage = (config = {}) => {
    const {dispatch, getState} = store;
    const {
      chatView: {
        userInput,
        botState: {botStepInProgress, botStepMessage}
      },
      appState: {domain, activeIssueId, issueType, reEngagementId}
    } = getState();
    const {msgBody, msgType, onSuccess, onEnd} = config;
    const xhrIssueType = chatViewHelpers.getPluralizedIssueType(issueType);
    const actionsToDispatch = [disableReplyBox(), actionCreators.setFooterInactive()];
    const isIssue = issueType === ISSUE_TYPE.ISSUE;
    const isPreIssue = issueType === ISSUE_TYPE.PRE_ISSUE;
    const latestMessage = botStepInProgress ? botStepMessage : getLatestMessage();
    let xhrData = null;

    // There are two ways to get prepared message xhr data
    // a] Config - used when we have to directly add message like user
    //             accepted/rejected resolution question
    // b] User input - used when user adds a message through input
    if (msgType && msgBody) {
      xhrData = messageHelpers.getPreparedMessageDataFromConfig({
        msgType,
        msgBody
      });
    } else if (!messageHelpers.isMessageTypeSupported(latestMessage.type)) {
      xhrData = messageHelpers.getPreparedMessageDataForUnsupportedBotMessage({
        latestMessage,
        isIssue
      });
    } else {
      xhrData = messageHelpers.getPreparedMessageDataFromUserInput({
        input: userInput,
        latestMessage,
        isIssue,
        botStepInProgress
      });
    }

    if (reEngagementId) {
      xhrData.re_engagement_id = reEngagementId;

      // Remove re-engagement id from the state & localStorage
      dispatch(actionCreators.resetReEngagementId());
    }

    if (isPreIssue || (isIssue && botStepInProgress)) {
      actionsToDispatch.push(toggleSystemTyping(true));
    }

    dispatch(batchActions(actionsToDispatch));

    xhr({
      route: routes.postUserReply(domain, activeIssueId, xhrIssueType),
      data: xhrHelpers.getPreparedXhrData(xhrData, {
        skipPlatformId: true
      }),
      method: "POST",
      headers: xhrHelpers.getCommonHeaders(),
      onSuccess: (response) => {
        // We do not want to batch following actions as we have to explicitly
        // enable reply box first and then add messages.
        // This is to allow reply box to take height first and then message list
        // updation will scroll the messages to bottom.
        // In case of preIssue, we do not want to enable reply box as it will be
        // enabled according to next bot step.
        // In case of issue, we want to enable reply box only if current step is
        // not bot.
        if (isIssue && !botStepInProgress) {
          dispatch(enableReplyBox());
        }

        // This response type indicates that the first message from the user was sent.
        // Trigger conversationStartEvent which, then, can be tracked by the
        // addEventListener callbacks
        if (response.type === MESSAGE_TYPE.RESP_EMPTY_MSG_WITH_TEXT_INPUT) {
          dispatch(postSdkMessage.conversationStartEvent(response.body));
        }

        if (TEXT_INPUT_MESSAGE_TYPES.indexOf(response.type) !== -1) {
          dispatch(postSdkMessage.messageAddEvent(MESSAGE_ADD_EVENT_TYPES.TEXT, response.body));
        }

        if (response.type === MESSAGE_TYPE.ACCEPTED) {
          dispatch(postSdkMessage.conversationEndEvent());
        }

        dispatch(
          batchActions([
            addMessages({
              messages: [response],
              responseType: response.type
            }),
            updateReplyText("")
          ])
        );

        if (onSuccess) {
          onSuccess(response);
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
          dispatch(batchActions([enableReplyBox(), toggleSystemTyping(false)]));
        } else if (isIssue) {
          dispatch(enableReplyBox());
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
      const state = getState();
      const {
        appState: {activeIssueId, issueType, issueState},
        chatView: {userInput, intents},
        ui: {text}
      } = state;
      const trimmedValue = userInput.value.trim();

      if (!userInput.selectedOption && (userInput.disabled || !trimmedValue)) {
        return;
      }

      const errorMsg = chatViewHelpers.validateUserInput(userInput, text);

      if (errorMsg) {
        dispatch(
          updateUserInputData({
            errorMsg
          })
        );
        return;
      }

      // If current issue state is rejected, don't fire xhr to send messages to backend.
      if (issueState === ISSUE_STATE.REJECTED) {
        dispatch(
          createMessage({
            type: MESSAGE_TYPE.TEXT,
            issueId: activeIssueId,
            messageConfig: {
              body: trimmedValue,
              isCustomerMsg: true
            },
            onAddMessage: () => {
              dispatch(updateReplyText(""));
            }
          })
        );
        return;
      }

      dispatch(disableReplyBox());

      dispatch(
        updateUserInputData({
          value: trimmedValue
        })
      );

      // If the issue type is not "initial" i.e. an issue / a preissue has been
      // created
      // Send the user message to the backend.
      // Else if the issue type is "initial" i.e. an issue / a preissue
      // hasn't been created yet and
      // the initial user message is not set yet (via the API)
      // Set the initial user message in the state and
      // Create the preIssue (the create preIssue fn uses the initial user message
      // set in the state).
      if (issueType !== ISSUE_TYPE.INITIAL) {
        postUserMessage({
          onSuccess: () => {
            handleIssueReopen(issueState);
            dispatch(updateReplyText(""));
            audioHelpers.playSend();
          }
        });
      } else {
        // @TODO: Lazy Preissue Creation
        // 1. This sets the initial user message under sdkConfigOptions in
        // the appState. Consider moving it out of this object. For now, the
        // create preIssue fn is going to use this value. Fix in the next commits.
        // 2. Add a check so that the initial user message is added only if it's
        // not present already. For the initial user message added via the API,
        // createPreIssue should be called as soon as the reply box is enabled.
        // This flow (submitReply) won't be invoked in that case.
        dispatch(actionCreators.setInitialUserMsg(trimmedValue));

        if (intents.isSearching) {
          analyticsHelpers.track(EVENT.SEARCH_INTENTS);
        }

        dispatch(createPreIssue());
      }
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
      dispatch(
        batchActions([
          actionCreators.setResolutionQuestionCompleted(false),
          setChatViewFooter(ACTIVE_FOOTER.REPLY),
          updateIssueState(ISSUE_STATE.ACTIVE)
        ])
      );
      startPollingForMessages();
      dispatch(postSdkMessage.conversationReopenedEvent());
    }
  };

  /**
   * Return latest message object from message list
   */
  const getLatestMessage = () => {
    const {
      chatView: {messageList}
    } = store.getState();
    return messageList[messageList.length - 1];
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
   * Check if the last selected intent is the leaf intent or not.
   * @param {String[]} selectedIntentIds - Selected intent ids
   * @param {Object} intentsMap - Intents map
   * @returns {Boolean} - True, if the last selected intent is leaf intent.
   */
  const _wasLeafIntentSelected = (selectedIntentIds, intentsMap) => {
    if (!selectedIntentIds || !selectedIntentIds.length) {
      return false;
    }

    const lastSelectedIntentId = selectedIntentIds[selectedIntentIds.length - 1];
    const {children} = intentsMap[lastSelectedIntentId];

    return !children || !children.length;
  };

  /**
   * Get the labels of the intent selected
   * @param {String[]} selectedIntentIds - Selected intent ids
   * @param {Object} intentsMap - Intents Map
   * @returns {Array} - Labels of the selected intent.
   */
  const _getIntentLabels = (selectedIntentIds, intentsMap) => {
    return selectedIntentIds.map((id) => intentsMap[id].label);
  };

  /**
   * Prepare pre-issue XHR data
   * @param {Object} state - Whole application state.
   * @returns {Object} - The data required for pre-issue XHR
   */
  const _getPreparedPreIssueData = (state) => {
    const {
      appState: {
        tags,
        metadata,
        cif,
        featuresEnabled: {greeting: greetingFeatureEnabled},
        fullPrivacyEnabled,
        developerSetLanguage,
        userName,
        userId,
        analytics,
        sdkConfigOptions: {initialUserMessage},
        internalHsConfigData: {voiceMeta: {deflectionContactFlowId = ""} = {}}
      },
      chatView: {intents, userInput},
      ui: {
        text: {greetingMsg}
      }
    } = state;

    const meta = {
      device_info: getPreparedDeviceInfo()
    };

    if (tags) {
      meta.custom_meta = {
        "hs-tags": tags
      };
    }

    // We need to send deflection contact flow id to backend so that
    // we know webchat issue is created for SMS deflection use case.
    if (deflectionContactFlowId) {
      meta.voice_meta = {
        deflection_contact_id: deflectionContactFlowId
      };
    }

    if (metadata && Object.keys(metadata).length) {
      meta.custom_meta = update(meta.custom_meta, {
        $merge: metadata
      });
    }

    /**
     * Note: These are the required fields for pre-issues XHR.
     * sm = sdk meta
     * cb = chat bots
     * acid = analytics conversation id
     * library_version = current webchat version
     * timezone_minutes = timezone offset. This is required while rendering
     * the message timestamp in re-engagement email.
     * device_language = Device language
     */
    const xhrData = {
      meta: JSON.stringify(meta),
      sm: JSON.stringify({
        cb: true
      }),
      acid: analytics.sessionId,
      library_version: WEB_CHAT_VERSION,
      timezone_minutes: -new Date().getTimezoneOffset(),
      device_language: browserUtils.getLanguage()
    };

    // If CIF is set and contains at least one field, add it to XHR data
    if (cif && Object.keys(cif).length) {
      xhrData.custom_fields = JSON.stringify(cif);
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

    if (developerSetLanguage) {
      xhrData.developer_set_language = developerSetLanguage;
    }

    // Passing user_id is a temporary backend requirement.
    if (userId) {
      xhrData.user_id = userId;
    }

    // If any intent is selected, pass the intent related data
    if (_wasLeafIntentSelected(intents.selectedIntentIds, intents.tree.intentsMap)) {
      xhrData.intent = JSON.stringify(intents.selectedIntentIds);
      // Create user message if the intent was selected by the user

      xhrData.intent_labels = _getIntentLabels(intents.selectedIntentIds, intents.tree.intentsMap);

      // If user entered some text before selecting an intent, send it as search term (st).
      // This would be used by Data Science to improve their algorithms.
      if (userInput.value) {
        xhrData.st = userInput.value;
      }
    } else if (initialUserMessage) {
      // If initial user message is present in the state, send it with the
      // create preissue API request.
      xhrData.user_message = initialUserMessage;
    }

    // If intent tree was shown, we have to send intent tree id everytime.
    if (intents.tree.id) {
      xhrData.tree_id = intents.tree.id;
    }

    return xhrData;
  };

  /**
   * Fire analytics event for the first message.
   * We track first message event from Webchat because the analytics want it for ordering.
   * All other messages are tracked by dashboard events.
   * @param {Object[]} messages - Array of messages
   */
  const _trackFirstMessage = (messages = []) => {
    const firstMessage = messages[0];

    if (firstMessage) {
      analyticsHelpers.track(EVENT.MESSAGE_SENT, {
        message: firstMessage
      });
    }
  };

  /**
   * Create pre-issue on backend.
   */
  const createPreIssue = () => {
    return (dispatch, getState) => {
      const state = getState();
      const xhrData = _getPreparedPreIssueData(state);
      const {
        appState: {domain},
        ui: {
          text: {networkError, retryBtn}
        }
      } = state;

      // We need to hide footer while creating preIssue because the default
      // value of input disabled is false, in store on page refresh.
      handleIssueFooterAndTAI(DISABLE_FOOTER);

      createPreissueXhr = xhr({
        route: routes.postPreIssue(domain),
        data: xhrHelpers.getPreparedXhrData(xhrData),
        headers: xhrHelpers.getCommonHeaders(),
        method: "POST",
        onSuccess: (response, xhrObj, statusCode) => {
          // If pre-issue exists then just start the poller to fetch existing.
          if (statusCode === RESPONSE_STATUS_CODE.PRE_ISSUE_EXISTS) {
            startPollingForMessages();
            return;
          }

          const config = {
            activeIssueId: response.id,
            internalIssueId: response.internal_id,
            // @TODO: Intents: Remove hardcoded "preissue" after backend starts sending type
            issueType: response.type || "preissue"
          };

          dispatch(issueCreated(config));

          startPollingForMessages();

          _trackFirstMessage(response.messages);
          // Track the issue created event.
          // @TODO: Confirm if issue created event has to be tracked from Web Chat.
          // analyticsHelpers.track (EVENT.ISSUE_CREATED);
        },
        onFailure: () => {
          // When start new conversation button is clicked, we clear the current state of the app
          // (app reset), and it is restored when the preIssue call succeeds and starts polling
          // for messages. In case of failure, we still need to show the messages, but we don't
          // need to poll for new ones. Hence, we have fetchMessages () call.
          handleIssueFooterAndTAI(ENABLE_FOOTER);
          dispatch(
            batchActions([
              setChatViewError({
                type: ERROR_TYPES.PRE_ISSUE_FAILURE,
                title: networkError,
                cta: retryBtn
              }),
              actionCreators.toggleChatViewLoading(false)
            ])
          );
          fetchMessages();
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
      const {type: errorType} = getState().chatView.error;

      switch (errorType) {
        case ERROR_TYPES.PRE_ISSUE_FAILURE:
          dispatch(createPreIssue());
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
      processedState = chatViewHelpers.getProcessedIssueState(state);
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
    const {dispatch} = store;

    dispatch(setUserIsViewingPastMessages(userHasScrolledToPastConvs));
    dispatch(markMessagesSeen());
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
      const msg = messageHelpers.createMessage(messageType, messageConfig);

      // As this message is created on frontend, it is already in processed format.
      // So, directly add message in message list.
      const actionsToDispatch = [
        addMessages({
          messages: [msg],
          process: false
        })
      ];

      if (typingTimer) {
        dispatch(toggleSystemTyping(true));

        if (systemTypingTimerId) {
          window.clearTimeout(systemTypingTimerId);
          systemTypingTimerId = null;
        }

        systemTypingTimerId = window.setTimeout(() => {
          dispatch(batchActions([toggleSystemTyping(false), ...actionsToDispatch]));
          if (onAddMessage) {
            onAddMessage(msg);
          }
          if (playAudio) {
            audioHelpers.playAudio(msg.isCustomerMsg);
          }
        }, typingTimer);
      } else {
        dispatch(batchActions(actionsToDispatch));
        if (onAddMessage) {
          onAddMessage(msg);
        }
        if (playAudio) {
          audioHelpers.playAudio(msg.isCustomerMsg);
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

      dispatch(disableReplyBox());
      // @NOTE :- Files is not an array but array like object
      for (let i = 0; i < filesLength; i++) {
        dispatch(createAttachmentMessage(files[i]));
      }
      // Timeout is used to avoid enabling replyBox in same update cycle
      // This provides async execution of enabling replyBox
      // Requirement :- Auto focus on text area after adding attachments
      window.setTimeout(() => {
        dispatch(enableReplyBox());
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
        appState: {domain, activeIssueId, issueState}
      } = getState();
      const {file, attachmentMsgId} = config;
      const pluralIssueType = chatViewHelpers.getPluralizedIssueType(ISSUE_TYPE.ISSUE);

      upload({
        route: routes.postUserReply(domain, activeIssueId, pluralIssueType),
        formData: xhrHelpers.getPreparedXhrData(
          {
            "issue-id": activeIssueId,
            "message-type": MESSAGE_TYPE.ATTACHMENT
          },
          {
            skipPlatformId: true
          }
        ),
        file: file,
        headers: xhrHelpers.getCommonHeaders(),
        onSuccess: (response) => {
          dispatch(postSdkMessage.messageAddEvent(MESSAGE_ADD_EVENT_TYPES.ATTACHMENT));

          // Remove the FE (dummy) attachment message from message list
          // Add new backend message in message list
          handleIssueReopen(issueState);
          dispatch(
            batchActions([
              removeMessage(attachmentMsgId),
              addMessages({
                messages: [response]
              })
            ])
          );
          audioHelpers.playSend();
        },
        onFailure: (response) => {
          dispatch(setAttachmentError(attachmentMsgId, response.errorCode));
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
      const state = getState();
      const {appState} = state;
      const {activeIssueId, attachmentsWhitelist} = appState;

      if (attachmentMsgId) {
        dispatch(
          uploadAttachment({
            file,
            attachmentMsgId
          })
        );
      } else {
        // If attachmentMsgId is not present, create dummy issue first then
        // upload an attachment
        dispatch(
          createMessage({
            type: MESSAGE_TYPE.ATTACHMENT,
            issueId: activeIssueId,
            messageConfig: {
              file
            },
            onAddMessage(msg) {
              attachmentMsgId = msg.id;
              if (!attachmentsHelpers.isAttachmentTypeValid(msg.file.type, attachmentsWhitelist)) {
                // If attachment type is not valid, set error on message
                dispatch(setAttachmentError(attachmentMsgId, FILE_UPLOAD_ERRORS.INVALID_TYPE));
              } else if (!attachmentsHelpers.isAttachmentsSizeValid(msg.file.size)) {
                // If attachment size is not valid, set error on message
                dispatch(setAttachmentError(attachmentMsgId, FILE_UPLOAD_ERRORS.SIZE_EXCEEDED));
              } else {
                dispatch(
                  uploadAttachment({
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
      postUserMessage({
        msgBody: MESSAGE_BODY.SOLUTION_ACCEPTED,
        msgType: MESSAGE_TYPE.ACCEPTED,
        onSuccess: () => {
          dispatch(actionCreators.setResolutionQuestionCompleted(true));
          dispatch(showPostIssueResolutionFooter());
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
      postUserMessage({
        msgBody: MESSAGE_BODY.SOLUTION_REJECTED,
        msgType: MESSAGE_TYPE.REJECTED,
        onSuccess: () => {
          dispatch(
            batchActions([
              actionCreators.setResolutionQuestionCompleted(true),
              setChatViewFooter(ACTIVE_FOOTER.SOLUTION_REJECTED)
            ])
          );
        }
      });
    };
  };

  /**
   * Action to skip user input
   * First update the skipped state in user input and then post user message
   * @returns {Function} - Action
   */
  const skipUserInput = () => {
    return (dispatch) => {
      dispatch(
        updateUserInputData({
          skipped: true
        })
      );
      postUserMessage();
    };
  };

  /*
   * Return the action to set the local greeting message id in the state
   * @param {string} id - message id
   * @returns {Object} - the action object
   */
  const saveLocalGreetingMessageId = (id) => {
    return {
      type: ACTION_TYPES.SET_LOCAL_GREETING_MESSAGE_ID,
      id
    };
  };

  /**
   * Create greeting message and add it to the message list. Check if this
   * feature is enabled before doing so.
   * @returns {Object} - the action object
   */
  const addGreetingMessage = () => {
    return (dispatch, getState) => {
      const {
        appState: {
          featuresEnabled: {greeting: greetingMessageFeatureIsEnabled}
        },
        ui: {
          text: {greetingMsg: greetingMessageBody}
        }
      } = getState();

      if (!greetingMessageFeatureIsEnabled) {
        return;
      }

      dispatch(
        createMessage({
          type: MESSAGE_TYPE.TEXT,
          messageConfig: {
            body: greetingMessageBody,
            isCustomerMsg: false,
            isGreetingMessage: true
          },
          onAddMessage: (localGreetingMessage) => {
            dispatch(saveLocalGreetingMessageId(localGreetingMessage.id));
          }
        })
      );
    };
  };

  /**
   * Return the action to be dispatched when an issue/preissue is created.
   * @param {Object} config
   * @param {String} config.activeIssueId
   * @param {String} config.internalIssueId
   * @param {String} config.issueType
   * @returns {Object} - the action object
   */
  const issueCreated = (config) => {
    return {
      type: ACTION_TYPES.ISSUE_CREATED,
      config
    };
  };

  /**
   * Action to load the intents tree.
   *
   * @param {Object} [callbacks]
   * @param {Function} [callbacks.onSuccess]
   * @param {Function} [callbacks.onFailure]
   * @returns {Function} - Action
   */
  const loadIntentsTree = (callbacks = {}) => {
    return (dispatch, getState) => {
      const {domain, featuresEnabled} = getState().appState;

      if (!featuresEnabled.intents) {
        return;
      }

      dispatch(actionCreators.intentsTreeRequest());

      xhr({
        route: routes.getIntentTree(domain),
        headers: xhrHelpers.getCommonHeaders(),
        data: xhrHelpers.getPreparedXhrData(),
        onSuccess: (response) => {
          dispatch(actionCreators.intentsTreeSuccess(response));
          if (callbacks.onSuccess) {
            callbacks.onSuccess(response);
          }
        },
        onFailure: () => {
          dispatch(actionCreators.intentsTreeFailure());
          if (callbacks.onFailure) {
            callbacks.onFailure();
          }
        }
      });
    };
  };

  /**
   * Action to load the intents model.
   *
   * @returns {Function} - Action
   */
  const loadIntentsModel = () => {
    return (dispatch, getState) => {
      const {
        appState: {domain},
        chatView: {
          intents: {tree}
        }
      } = getState();

      xhr({
        route: routes.getIntentModel(domain, tree.id),
        headers: xhrHelpers.getCommonHeaders(),
        data: xhrHelpers.getPreparedXhrData({
          tree_version: tree.version
        }),
        onSuccess: (response) => {
          dispatch(actionCreators.intentsModelSuccess(response));
        },
        onFailure: () => {
          // @TODO: Intents: Handle failure
        }
      });
    };
  };

  /**
   * Action to select an intent
   * @param {Object} intent - Selected intent
   */
  const selectIntent = (intent) => {
    return (dispatch, getState) => {
      dispatch(actionCreators.intentSelected(intent));

      // If leaf intent node is selected, create pre-issue with that intent
      if (!intent.children) {
        const {
          chatView: {intents}
        } = getState();

        // "Search intent" event needs to be fired before "select intent" event.
        if (intents.isSearching) {
          analyticsHelpers.track(EVENT.SEARCH_INTENTS);
        }

        analyticsHelpers.track(EVENT.INTENT_SELECTED, {intent});
        dispatch(createPreIssue());
      } else {
        analyticsHelpers.track(EVENT.INTENT_SELECTED, {intent});
      }
    };
  };

  return {
    createPreIssue,
    updateReplyText,
    enableReplyBox,
    submitReply,
    abortCreatePreissueXhr,
    startPollingForMessages,
    stopPollingForMessages,
    addMessages,
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
    handleErrorAction,
    skipUserInput,
    addGreetingMessage,
    loadIntentsTree,
    loadIntentsModel,
    selectIntent,
    updateReplyTextAndSearchIntents
  };
});
