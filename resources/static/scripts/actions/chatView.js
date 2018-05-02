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
      MESSAGES_FORCE_POLLING_TIMEOUT
    } = CHAT_VIEW_CONSTANTS;

    const {FILE_UPLOAD_ERRORS, TYPE: ERROR_TYPES} = ERROR_CONSTANTS;

    const {
      ISSUE_STATE,
      ISSUE_TYPE,
      XHR_ISSUE_STATE
    } = APP_STATE_CONSTANTS;

    const {EVENT} = analyticsConstants;

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
     * @returns {Object} - action
     */
    const addMessages = (config) => {
      const {messages, process = true} = config;
      let processedMessages = messages;

      if (process) {
        processedMessages = messageHelpers.getProcessedMessages (messages);
      }

      return {
        type: ACTION_TYPES.ADD_MESSAGES,
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
     * @param {Number} msgCursor - message cursor (unix timestamp)
     * @returns {Object} - action
     */
    const setActiveIssueMsgCursor = (msgCursor) => {
      return {
        type: ACTION_TYPES.SET_ACTIVE_ISSUE_MSG_CURSOR,
        msgCursor
      };
    };

    /**
     * Action to set unread messages count.
     * @param {Number} count - unread count.
     * @returns {Object} - action
     */
    const setUnreadCount = (count) => {
      return {
        type: ACTION_TYPES.SET_UNREAD_COUNT,
        count
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
            unreadCount
          }
        } = getState ();
        const pluralIssueType = chatViewHelpers.getPluralizedIssueType (issueType);

        if (unreadCount !== 0) {
          dispatch (setUnreadCount (0));
          postSdkMessage.updateUnreadCount (0);
        }

        xhr ({
          route: routes.putMessages (domain, activeIssueId, pluralIssueType),
          data: xhrHelpers.getPreparedXhrData ({
            md_state: "read"
          }, SKIP_PLATFORM_ID),
          method: "PUT",
          headers: xhrHelpers.getCommonHeaders ()
        });
      };
    };

    /**
     * Action to switch to chat view.
     * Also mark messages seen if there are any unread messages.
     * @returns {Function} - action
     */
    const switchToChatView = () => {
      return (dispatch, getState) => {
        const {unreadCount} = getState ().chatView;

        if (unreadCount !== 0) {
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
     * Returns active issue and list of messages
     * @param {Object} config - config for creating active issue and  message list
     * @param {Object} config.issues - issues list
     * @returns {Object} - config of active issue and messages
     */
    const getCurrentIssueAndMessages = (config) => {
      const {
        chatView: {
          issueCursor
        }
      } = store.getState ();
      const {issues} = config;
      const currentIssue = issues [0];
      const currentIssueMessages = (currentIssue && currentIssue.messages) || [];
      let previousIssue = null;
      let previousIssueMessages = [];
      let issueCreationDate = currentIssue.created_at;
      let messages = [];

      // If current issue type is 'issue', find pre issue from issues list
      // and save it in previous
      if (currentIssue && currentIssue.type === ISSUE_TYPE.ISSUE) {
        previousIssue = arrayUtils.find (issues, (issue) => {
          return (issue.type === ISSUE_TYPE.PRE_ISSUE &&
                  issue.internal_id === currentIssue.preissue_id);
        });
        if (previousIssue) {
          issueCreationDate = previousIssue.created_at;
          previousIssueMessages = previousIssue.messages || previousIssueMessages;
        }
      }

      messages = previousIssueMessages.concat (currentIssueMessages);

      // For the first fetch of issues list, add conversation start date message
      // at the start of message list. (This is a system info message)
      if (!issueCursor) {
        const conversationStartDateMessage = chatViewHelpers.createMessage (
          MESSAGE_TYPE.SYSTEM_INFO, {
            body: dateUtils.format (issueCreationDate, "{dddd}, {mmmm} {dd}, {yyyy}")
          }
        );
        messages = [conversationStartDateMessage].concat (messages);
      }

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
          issueId: currentIssue.internal_id
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
     */
    const handleChatEnd = () => {
      const {dispatch, getState} = store;
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
        type: MESSAGE_TYPE.SYSTEM_INFO,
        messageConfig: {
          body: text.conversationEndNote
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
        },
        chatView: {
          issueCursor
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
          handleChatEnd ();
        }
      } else if (issueState === ISSUE_STATE.REJECTED && !issueCursor) {
        // a] Issue cursor is not present i.e. its first poll (page refresh)
        // AND
        // b] Issue state is 'rejected' then handle end chat
        handleChatEnd ();
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
          messageCursor,
          issueCursor,
          pollerFailureCount: prevPollerFailureCount
        }
      } = store.getState ();

      const xhrData = {
        "mc": JSON.stringify (messageCursor),
        "new-timestamp": Date.now ()
      };

      if (issueCursor) {
        xhrData.since = issueCursor;
      }

      lastFetchStartTime = Date.now ();
      lastFetchCompleted = false;

      fetchMessagesXhr = xhr ({
        route: routes.getIssuesAndMessages (domain),
        data: xhrHelpers.getPreparedXhrData (xhrData),
        method: "POST",
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
          // @NOTE - This is to make sure that onEnd is called even if
          // any code in onSuccess results in an Exception.
          try {
            lastPollerCallSucceeded = true;
            const {
              issues = [],
              timestamp
            } = response;

            if (!issues.length) {
              return;
            }

            const {
              currentIssue,
              messages
            } = getCurrentIssueAndMessages ({issues});

            const {
              id: issueId,
              internal_id: internalIssueId,
              type: currentIssueType,
              state_data: {
                state: issueState
              },
              csat_received: isCsatSubmitted
            } = currentIssue;
            const isPreIssue = (currentIssueType === ISSUE_TYPE.PRE_ISSUE);

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
              const pluralIssueType = chatViewHelpers.getPluralizedIssueType (currentIssueType);

              // Handle latest message only for preIssue
              if (isPreIssue) {
                handleLatestMessage (latestMessage);
              }

              dispatch (
                batchActions ([
                  addMessages ({
                    messages: processedMessages,
                    process: false
                  }),
                  setActiveIssueMsgCursor ({
                    [pluralIssueType]: {
                      [issueId]: timestamp
                    }
                  })
                ])
              );

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

            dispatch (setIssueCursor (timestamp));
          } catch (ex) {
            // @TODO - Ideally, this exception should be logged to server.
          }
        },
        onFailure: () => {
          // @TODO: Handler failure.
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
          unreadCount,
          issueCursor
        }
      } = getState ();
      const {messages} = config;
      let finalUnreadCount = unreadCount;

      // Calculate unread count for agent messages only
      messages.forEach ((msg) => {
        const {
          type,
          state,
          isCustomerMsg
        } = msg;

        if (!isCustomerMsg &&
            state !== MESSAGES_STATE.READ &&
            type !== MESSAGE_TYPE.SYSTEM_INFO &&
            chatViewHelpers.isRenderableMessage (type)) {
          finalUnreadCount++;
        }
      });

      // If the chat view is active, and the messenger is not in minimized state,
      // that means the user has seen the messages.
      if (!minimized && ACTIVE_VIEW.CHAT === activeView) {
        dispatch (markMessagesSeen ());
      } else {
        dispatch (setUnreadCount (finalUnreadCount));
        postSdkMessage.updateUnreadCount (finalUnreadCount);
      }

      // Do not play sound on page load even if there are unread messages
      if (issueCursor && finalUnreadCount) {
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
          handleChatEnd ();
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
        xhrData = chatViewHelpers.getPreparedMessageData ({
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
            dispatch (
              batchActions ([
                setActiveIssueId (newIssueId),
                actionCreators.setInternalIssueId (response.internal_id),
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
        const msg = chatViewHelpers.createMessage (messageType, messageConfig);

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
      switchToChatView,
      createAttachmentMessages,
      createAttachmentMessage,
      showPostIssueResolutionFooter,
      acceptResolutionQuestion,
      rejectResolutionQuestion,
      setUserInputData,
      updateUserInputData,
      setUserSelectedOption,
      handleErrorAction
    };
  });
