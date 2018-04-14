/**
 * Chat view actions.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 12, 2017
 */

define ("actions/chatView",
  [
    "store",
    "normalizr",
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
    "gunpowder/utils/schema",
    "gunpowder/utils/object",
    "gunpowder/utils/uuid",
    "gunpowder/utils/date",
    "actions/entities",
    "actions/batch",
    "actions/actionCreators",
    "helpers/entitySchema",
    "helpers/entity",
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
  function (store, normalizr, ACTION_TYPES, routes, CHAT_VIEW_CONSTANTS,
    ACTIVE_VIEW, MESSAGE_CONSTANTS, APP_STATE_CONSTANTS, ERROR_CONSTANTS,
    analyticsConstants, xhr, arrayUtils, schema, objUtils, uuidGenerator, dateUtils,
    entitiesActions, batchActions, actionCreators, entitySchema, entityHelpers,
    chatViewHelpers, xhrHelpers, audioHelpers, liveUpdatesHelpers, attachmentsHelpers,
    analyticsHelpers, commonHelpers, postSdkMessage, browserUtils, upload) {
    "use strict";

    const {normalize} = normalizr;

    const {
      TYPE: MESSAGE_TYPE,
      TYPING_TIMEOUT,
      TIMEOUT: MESSAGES_TIMEOUT,
      STATE: MESSAGES_STATE,
      BODY: MESSAGE_BODY
    } = MESSAGE_CONSTANTS;

    const {
      ACTIVE_FOOTER,
      MESSAGES_POLLING_TIMEOUT,
      MESSAGES_FORCE_POLLING_TIMEOUT,
      INFO_BOT_FIELDS
    } = CHAT_VIEW_CONSTANTS;

    const {Input} = schema;

    const {FILE_UPLOAD_ERRORS} = ERROR_CONSTANTS;

    const {
      ISSUE_STATE,
      ISSUE_TYPE,
      PRE_CHAT_STATE,
      PRE_CHAT_FEATURES,
      XHR_ISSUE_STATE
    } = APP_STATE_CONSTANTS;

    const GREETING_STATE = PRE_CHAT_STATE.greeting,
          USER_MESSAGE_STATE = PRE_CHAT_STATE.initialUserMessage,
          ANSWER_BOT_STATE = PRE_CHAT_STATE.answerBot,
          INFO_BOT_STATE = PRE_CHAT_STATE.infoBot;

    const {EVENT} = analyticsConstants;

    const PROCESS = true;
    const SKIP_PLATFORM_ID = true;

    let systemTypingTimerId = null,
        pollingEnabled = false,
        fetchMessagesXhr = null,
        fetchMessagesTimer = null,
        lastFetchStartTime = null,
        lastFetchCompleted = false;

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
        processedMessages = entityHelpers.getProcessedMessages (messages);
      }

      return {
        type: ACTION_TYPES.ADD_MESSAGES,
        messages: processedMessages
      };
    };

    /**
     * Action to set messages in message list.
     * This action will replace the current messages array with the
     * given messages array. If you want to push messages to an issue,
     * use addMessages action.
     * @param {Array} messages - array of message
     * @returns {Object} - action
     */
    // @TODO - This might not be used after pre-chat clean up!
    const setMessages = (messages) => {
      return {
        type: ACTION_TYPES.SET_MESSAGES,
        messages
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
     * Start polling for messages.
     */
    const startPollingForMessages = () => {
      pollingEnabled = true;
      lastFetchCompleted = true;

      fetchMessages ();

      fetchMessagesTimer = window.setInterval (_restartFetchMessages, MESSAGES_POLLING_TIMEOUT);

      liveUpdatesHelpers.openWsConnection ();
      // Since the ws connection is asynchronous, this call to subscribe
      // to agent activity will go to the buffer and actual subscription
      // will take place when the web socket connection is completed.
      liveUpdatesHelpers.subscribeAgentActivityTopic ();
      liveUpdatesHelpers.attachAgentActivityListener ();
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

      // For messages other than bot, input wont be present
      if (!input) {
        // For normal message, reset user input and retain reply typed by user
        dispatch (resetUserInput ({value: true}));
        return;
      }

      const {getState} = store;
      const {type} = message;
      const {
        appState: {
          sdkConfigOptions: {
            initialUserMessage
          }
        }
      } = getState ();
      const processedUserInput = chatViewHelpers.getProcessedUserInput ({
        messageType: type,
        input
      });

      // Mandatory actions which will be preformed for every bot step
      dispatch (
        batchActions ([
          // Set processed user input and save it in store
          setUserInputData (processedUserInput),
          // Set footer type as reply because this is bot step, we accept some user input
          setChatViewFooter (ACTIVE_FOOTER.REPLY)
        ])
      );

      // Optional actions like submiting user reply if first user message is set
      // through api
      // If message type is accept first user message (EMPTY_MSG_WITH_TEXT_INPUT)
      // and initialUserMessage is set through api, do not wait for user input
      // Directly send the message as bot response
      if (type === MESSAGE_TYPE.EMPTY_MSG_WITH_TEXT_INPUT && initialUserMessage) {
        postUserMessage ({
          messageType: type,
          messageBody: initialUserMessage
        });
      }
    };

    /**
     * Handle latest message for bot actions and bot input and take actions
     * @param {Object} latestMessage - latest message in message list
     */
    const handleLatestMessage = (latestMessage) => {
      // @TODO - If the bot control messages are not present in same poller, we
      // need to handle that case as footer is dependant on it.
      const {dispatch} = store;
      const {
        type,
        has_next_bot: hasNextBot
      } = latestMessage;

      switch (type) {
        case MESSAGE_TYPE.BOT_STARTED:
          dispatch (toggleSystemTyping (true));
          break;

        case MESSAGE_TYPE.BOT_ENDED:
          const actionsToDispatch = [resetUserInput ()];
          if (!hasNextBot) {
            actionsToDispatch.push (setChatViewFooter (ACTIVE_FOOTER.REPLY));
          }
          dispatch (batchActions (actionsToDispatch));
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
     * a] Show start new conversation footer
     * b] Add chat ended message in message list
     */
    const handleChatEnd = () => {
      const {dispatch, getState} = store;
      const {
        ui: {
          text
        }
      } = getState ();
      // Show start new conversation footer
      dispatch (setChatViewFooter (ACTIVE_FOOTER.START_NEW_CONVERSATION));
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
          issueCursor
        }
      } = store.getState ();

      const xhrData = {
        mc: JSON.stringify (messageCursor)
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
            const {
              issues = [],
              timestamp
            } = response;

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

            if (!isIssueActive (issueState)) {
              stopPollingForMessages ();
            }

            handleTAI ({
              currentIssueType,
              previousIssueType
            });

            dispatch (
              batchActions ([
                actionCreators.toggleLoading (false),
                setActiveIssueId (issueId),
                actionCreators.setInternalIssueId (internalIssueId),
                setCsatSubmitted (isCsatSubmitted),
                updateIssueState (issueState, PROCESS),
                updateIssueType (currentIssueType)
              ])
            );

            const messagesLength = messages.length;
            if (messagesLength) {
              handleLatestMessage (messages [messagesLength - 1]);

              const pluralIssueType = chatViewHelpers.getPluralizedIssueType (currentIssueType);
              dispatch (
                batchActions ([
                  addMessages ({messages}),
                  setActiveIssueMsgCursor ({
                    [pluralIssueType]: {
                      [issueId]: timestamp
                    }
                  })
                ])
              );
              handleUnreadMessages ();
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
          lastFetchCompleted = true;
        }
      });
    };

    /**
     * Handle typing indicator behaviour
     * @param {Object} config
     * @param {String} config.currentIssueType - current issue type
     * @param {String} config.previousIssueType - previous issue type
     */
    const handleTAI = (config) => {
      const {dispatch} = store;
      const {currentIssueType, previousIssueType} = config;
      const currentIssueIsPreIssue = currentIssueType === ISSUE_TYPE.PRE_ISSUE;
      const preIssueConvertedToIssue = (previousIssueType === ISSUE_TYPE.PRE_ISSUE &&
                                        currentIssueType === ISSUE_TYPE.ISSUE);
      // Hide TAI if
      // a] poller's current issue type is preIssue
      //  OR
      // b] preIssue is converted to issue
      if (currentIssueIsPreIssue || preIssueConvertedToIssue) {
        dispatch (toggleSystemTyping (false));
      }
    };

    /**
     * Handle unread messages
     * Calculate unread (agent) message count by checking each message
     * If the widget is minimized, post message to parent with unread count which
     * will show unread notification on widget
     */
    const handleUnreadMessages = () => {
      const {dispatch, getState} = store;
      const {
        appState: {
          minimized,
          activeView
        },
        chatView: {
          unreadCount,
          messageList: messages,
          issueCursor
        }
      } = getState ();
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
          dispatch (
            addMessages ({
              messages: [response]
            })
          );

          if (onSuccess) {
            onSuccess (response);
          }
        },
        onFailure: () => {
          // Hide typing indicator and enable replyBox if submit user reply on
          // preIssue fails
          if (isPreIssue) {
            dispatch (batchActions ([
              enableReplyBox (),
              toggleSystemTyping (false)
            ]));
          }
        },
        onEnd: () => {
          // Only enable reply box in case of issue
          // In case of preIssue, keep showing TAI until we get next response
          // from poller.
          if (isIssue) {
            dispatch (enableReplyBox ());
          }

          if (onEnd) {
            onEnd ();
          }
        }
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
     * Action to set end user first message id.
     * @param {String} id
     * @returns {Object} - action
     */
    const setEndUserFirstMessageId = (id) => {
      return {
        type: ACTION_TYPES.SET_END_USER_FIRST_MESSAGE_ID,
        id
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
     * Fire xhr to register user profile.
     * @param {Object} user - user object. Contains identifier, name and email.
     * @param {String} domain - domain name.
     * @param {Object} [callbacks] - optional callbacks
     */
    const registerUserProfile = (user, domain, callbacks = {}) => {
      const {identifier, name, email} = user;

      const xhrData = {
        identifier: identifier
      };

      if (name) {
        xhrData.name = name;
      }
      if (email) {
        xhrData.email = email;
      }

      xhr ({
        route: routes.postProfile (domain),
        method: "POST",
        data: xhrData,
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
          if (callbacks.onSuccess) {
            callbacks.onSuccess (response);
          }
        },
        onFailure: () => {
          // @TODO: Handler failure.
        }
      });
    };

    const createIssue = () => {
      return (dispatch, getState) => {
        const state = getState ();
        const {appState} = state;
        const {dummyIssueId, userId, tags, cif, metadata} = appState;
        const endUserFirstMsg = commonHelpers.getEndUserFirstMessage ();

        // @TODO :- Remove this condition after verifying createIssue is not
        // called before setting first user message
        // If first end user message is not present, don't do anything
        if (!(endUserFirstMsg && endUserFirstMsg.body)) {
          return;
        }

        dispatch (disableReplyBox ());

        const xhrData = {
          "identifier": appState.identifier,
          "platform-id": appState.platformId,
          "message-body": endUserFirstMsg.body,
          "language": browserUtils.getLanguage ()
        };

        if (userId) {
          xhrData ["user-id"] = userId;
        }

        const meta = {
          device_info: metadata
        };

        if (tags) {
          meta.custom_meta = {
            "hs-tags": tags
          };
        }
        xhrData.meta = JSON.stringify (meta);

        // If cif is set and contains atleast one field, add to xhr data
        if (cif && Object.keys (cif).length) {
          xhrData.custom_fields = JSON.stringify (cif);
        }

        xhr ({
          route: routes.postIssue (appState.domain),
          data: xhrData,
          headers: xhrHelpers.getCommonHeaders (),
          method: "POST",
          onSuccess: (response) => {
            // @TODO - NORMALIZATION_CLEAN_UP
            const normalizedData = normalize (response, entitySchema.issue);
            const processedEntities = entityHelpers.getProcessedEntities (normalizedData.entities);
            dispatch (entitiesActions.setEntities (processedEntities));

            const endUserFirstMsgNewId = response.messages [0].id;
            // @TODO :- Don't directly manage entities from here!
            // Dispatch an action something like 'ISSUE_CREATED' which will :-
            // a] Remove dummy messages from entity store and localStorage
            // b] Replace dummy issue id of first user message with backend id
            //    in entity store and localStorage

            // Replace frontend created user message with backend message,
            // and add all dummy issue messages to the active issue.
            const dummyIssueMsgIds = state.entities.issues [dummyIssueId].messages.slice ();
            dummyIssueMsgIds.splice (
              dummyIssueMsgIds.indexOf (endUserFirstMsg.id),
              1,
              endUserFirstMsgNewId
            );

            const newIssueId = response.id;
            dispatch (
              batchActions ([
                setMessages (newIssueId, dummyIssueMsgIds),
                // Remove messages from dummy issue
                setMessages (dummyIssueId, []),
                setActiveIssueId (newIssueId),
                actionCreators.setInternalIssueId (response.internal_id),
                setEndUserFirstMessageId (endUserFirstMsgNewId),
                updateIssueState (ISSUE_STATE.ACTIVE),
                setChatViewFooter (ACTIVE_FOOTER.REPLY)
              ])
            );
            startPollingForMessages ();
          },
          onFailure: () => {
            // @TODO: Handler failure.
          },
          onEnd: () => {
            dispatch (enableReplyBox ());
          }
        });
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
              greetingMsg
            }
          }
        } = getState ();

        dispatch (disableReplyBox ());

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

            // Track the issue created event.
            // @TODO: Confirm if issue created event has to be tracked from Web Chat.
            // analyticsHelpers.track (EVENT.ISSUE_CREATED);
          },
          onEnd: () => {
            dispatch (enableReplyBox ());
          }
        });
      };
    };

    /**
     * Fetch data & creates issue on occurance of corresponding event.
     */
    const fetchDataForIssueCreation = () => {
      postSdkMessage.getParentInfo ();
    };

    /**
     * Action to get FAQ suggestions based on the message text.
     * @param {String} searchText - search text to pass on to the API to get FAQs
     * @param {Object} [callbacks] - optional callbacks
     * @returns {Object} - action
     */
    const getFaqSuggestions = (searchText, callbacks = {}) => {
      return (dispatch, getState) => {
        const state = getState ();
        const appState = state.appState;

        xhr ({
          route: routes.getFaqSuggestions (appState.domain),
          data: {
            "text": searchText,
            "platform-id": appState.platformId
          },
          headers: xhrHelpers.getCommonHeaders (),
          onSuccess: (response) => {
            // The response would contain a list of faq objects,
            // dispatch an action to set it to the store.
            const faqs = response.suggested_faqs;
            if (callbacks.onSuccess) {
              callbacks.onSuccess (faqs);
            }
          },
          onFailure: () => {
            if (callbacks.onFailure) {
              callbacks.onFailure ();
            }
          },
          onEnd: () => {
            if (callbacks.onEnd) {
              callbacks.onEnd ();
            }
          }
        });
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
     * Action to add greeting message.
     * @returns {Object} - Action
     */
    const addGreetingMessage = () => {
      return (dispatch, getState) => {
        const state = getState (),
              featureState = state.appState.preChatFeatureState.greeting;

        switch (featureState) {
          case GREETING_STATE.INITIAL:
            const defaultAgentMsgText = state.ui.text.greetingMsg;

            dispatch (
              createMessage ({
                type: MESSAGE_TYPE.TEXT,
                messageConfig: {
                  body: defaultAgentMsgText,
                  isCustomerMsg: false
                }
              })
            );
            dispatch (startNextPreChatFeature ());
            break;
          // @NOTE :- Skipping wait for user reply state as we want to start
          // next pre-chat feature. We have moved wait to user reply in
          // initialUserMessage pre-chat feature.
          // Keeping this case as the localStorage data on some site can still
          // contain this state.
          // @TODO :- Remove this case after implementing migrator for localStorage
          case GREETING_STATE.WAITING_FOR_USER_REPLY:
          case GREETING_STATE.COMPLETED:
            dispatch (startNextPreChatFeature ());
            break;
        }
      };
    };

    /**
     * Action to start first user message workflow
     * @returns {Object} - Action
     */
    const startInitialUserMsgPreChatFeature = () => {
      return (dispatch, getState) => {
        const state = getState (),
              {appState} = state,
              {initialUserMessage} = appState.sdkConfigOptions,
              featureState = appState.preChatFeatureState.initialUserMessage;

        switch (featureState) {
          case USER_MESSAGE_STATE.INITIAL:
            // If initial user message is present in store,
            // create message else wait for user input
            if (initialUserMessage) {
              dispatch (createInitialUserMessage (initialUserMessage));
            } else {
              dispatch (setChatViewFooter (ACTIVE_FOOTER.REPLY));
            }
            break;
          case USER_MESSAGE_STATE.COMPLETED:
            startNextPreChatFeature ();
            break;
        }
      };
    };

    /**
     * Action to create initial user message
     * @param {String} messageBody - body of user message
     */
    const createInitialUserMessage = (messageBody) => {
      return function (dispatch) {
        dispatch (
          createMessage ({
            type: MESSAGE_TYPE.TEXT,
            messageConfig: {
              body: messageBody,
              isCustomerMsg: true
            },
            playAudio: true,
            onAddMessage: (msg) => {
              dispatch (
                batchActions ([
                  setChatViewFooter (ACTIVE_FOOTER.BLOCKED),
                  setEndUserFirstMessageId (msg.id),
                  updateReplyText ("")
                ])
              );
              // Get parent data & create issue
              fetchDataForIssueCreation ();
            }
          })
        );
      };
    };

    /**
     * Action to update the pre-chat feature state.
     * @param {String} feature
     * @param {Object} featureState
     * @returns {Object} - Action
     */
    const updatePreChatFeatureState = (feature, featureState) => {
      return {
        type: ACTION_TYPES.UPDATE_PRE_CHAT_FEATURE_STATE,
        feature,
        featureState
      };
    };

    /**
     * Action to start answer bot workflow (FAQ suggestions).
     * @returns {Object} - Action
     */
    const startAnswerBot = () => {
      return (dispatch, getState) => {
        const {appState} = getState (),
              featureState = appState.preChatFeatureState.answerBot;

        switch (featureState) {
          case ANSWER_BOT_STATE.INITIAL:
            const endUserFirstMsg = commonHelpers.getEndUserFirstMessage ();

            dispatch (toggleSystemTyping (true));

            dispatch (getFaqSuggestions (endUserFirstMsg.body, {
              onSuccess: (faqs) => {
                // If there are no faq suggestions, move to next pre-chat feature,
                // otherwise create faq message.
                dispatch (toggleSystemTyping (false));
                if (!faqs.length) {
                  dispatch (startNextPreChatFeature ());
                } else {
                  dispatch (
                    createMessage ({
                      type: MESSAGE_TYPE.FAQ,
                      messageConfig: {
                        faqs
                      },
                      playAudio: true,
                      onAddMessage: () => {
                        onFaqSuggestionMessageAdd ();
                        dispatch (
                          updatePreChatFeatureState ("answerBot", ANSWER_BOT_STATE.FAQS_FETCHED)
                        );
                      }
                    })
                  );
                }
              },
              onFailure: () => {
                dispatch (toggleSystemTyping (false));
                // If there is any error while fetching faq suggestions,
                // move to next pre chat feature.
                dispatch (startNextPreChatFeature ());
              }
            }));
            break;

          case ANSWER_BOT_STATE.FAQS_FETCHED:
            onFaqSuggestionMessageAdd ();
            break;

          case ANSWER_BOT_STATE.WAITING_FOR_USER_FEEDBACK:
            store.dispatch (setChatViewFooter (ACTIVE_FOOTER.FAQ_SUGGESTIONS_FEEDBACK));
            break;

          case ANSWER_BOT_STATE.COMPLETED:
            startNextPreChatFeature ();
            break;
        }
      };
    };

    /**
     * Callback handler after the faq suggestions message is added.
     */
    const onFaqSuggestionMessageAdd = () => {
      const state = store.getState ();
      store.dispatch (setChatViewFooter (ACTIVE_FOOTER.BLOCKED));

      window.setTimeout (() => {
        store.dispatch (
          createMessage ({
            type: MESSAGE_TYPE.TEXT,
            messageConfig: {
              body: state.ui.text.faqSuggestionsAdditionalHelpMsg,
              isCustomerMsg: false
            },
            typingTimer: TYPING_TIMEOUT.FAQ_SUGGESTIONS_ADDITIONAL_HELP,
            playAudio: true,
            onAddMessage: () => {
              store.dispatch (
                batchActions ([
                  updatePreChatFeatureState (
                    "answerBot",
                    ANSWER_BOT_STATE.WAITING_FOR_USER_FEEDBACK
                  ),
                  setChatViewFooter (ACTIVE_FOOTER.FAQ_SUGGESTIONS_FEEDBACK)
                ])
              );
            }
          })
        );
      }, MESSAGES_TIMEOUT.FAQ_SUGGESTIONS_ADDITIONAL_HELP);
    };

    /**
     * Action to update info bot field value.
     * @param {String|Object} value
     * @returns {Object} - Action
     */
    // @TODO - PRE_CHAT_CLEANUP
    const updateInfoBotFieldValue = ({value, errorMsg}) => {
      return {
        type: ACTION_TYPES.UPDATE_INFO_BOT_FIELD_VALUE,
        value: {
          value,
          errorMsg
        }
      };
    };

    /**
     * Action to change the current info bot field.
     * @returns {Object} - Action
     */
    // @TODO - PRE_CHAT_CLEANUP
    const changeInfoBotCurrentField = () => {
      return {
        type: ACTION_TYPES.CHANGE_INFO_BOT_CURRENT_FIELD
      };
    };

    /**
     * Action to start info bot workflow.
     * @returns {Object} - Action
     */
    const startInfoBot = () => {
      return (dispatch, getState) => {
        const state = getState (),
              featureState = state.appState.preChatFeatureState.infoBot;

        dispatch (setChatViewFooter (ACTIVE_FOOTER.BLOCKED));

        switch (featureState) {
          case INFO_BOT_STATE.INITIAL:
            dispatch (
              createMessage ({
                type: MESSAGE_TYPE.TEXT,
                messageConfig: {
                  body: state.ui.text.infoBotRequestMsg,
                  isCustomerMsg: false
                },
                typingTimer: TYPING_TIMEOUT.INFO_BOT_REQUEST,
                onAddMessage: () => {
                  dispatch (
                    updatePreChatFeatureState ("infoBot", INFO_BOT_STATE.CURRENT_FIELD_TO_BE_ASKED)
                  );
                  dispatch (askInfoBotField ());
                }
              })
            );
            break;

          case INFO_BOT_STATE.CURRENT_FIELD_TO_BE_ASKED:
            dispatch (askInfoBotField ());
            break;

          case INFO_BOT_STATE.CURRENT_FIELD_ASKED:
            dispatch (setChatViewFooter (ACTIVE_FOOTER.INFO_BOT));
            break;

          case INFO_BOT_STATE.COMPLETED:
            startNextPreChatFeature ();
            break;
        }
      };
    };

    /**
     * Action to ask details of info bot field.
     * @returns {Object} - Action
     */
    // @TODO - PRE_CHAT_CLEANUP
    const askInfoBotField = () => {
      return (dispatch, getState) => {
        const state = getState ();
        const {infoBot} = state.chatView;
        const currentField = infoBot.data [infoBot.currentField];

        dispatch (setChatViewFooter (ACTIVE_FOOTER.BLOCKED));

        if (currentField) {
          dispatch (
            createMessage ({
              type: MESSAGE_TYPE.TEXT,

              messageConfig: {
                body: currentField.msg,
                isCustomerMsg: false
              },
              typingTimer: TYPING_TIMEOUT.INFO_BOT_FIELD,
              playAudio: true,
              onAddMessage: () => {
                dispatch (
                  batchActions ([
                    updatePreChatFeatureState ("infoBot", INFO_BOT_STATE.CURRENT_FIELD_ASKED),
                    setChatViewFooter (ACTIVE_FOOTER.INFO_BOT)
                  ])
                );
              }
            })
         );
        }
      };
    };

    /**
     * Action to submit info bot field.
     * Add user message using the user input and
     * change the current info bot field.
     * @returns {Object} - Action
     */
    // @TODO - PRE_CHAT_CLEANUP
    const submitInfoBotField = () => {
      return (dispatch, getState) => {
        const state = getState (),
              {infoBot} = state.chatView;

        // Trim white spaces in value
        const currentFieldVal = infoBot.data [infoBot.currentField].value;
        const updatedFieldVal = objUtils.shallowMerge ({
          value: currentFieldVal.value.trim ()
        },
        currentFieldVal, {
          skip: ["value"]
        });

        // As we are only saving serializable data in the store,
        // we are not saving the input object inside the store.
        // On submit of info bot field, create an input object instance to
        // validate the info field.
        const errorMsg = new Input (updatedFieldVal).isValid ();

        if (errorMsg) {
          dispatch (updateInfoBotFieldValue ({
            errorMsg
          }));
          return;
        }

        dispatch (
          createMessage ({
            type: MESSAGE_TYPE.TEXT,
            playAudio: true,
            messageConfig: {
              body: updatedFieldVal.value,
              isCustomerMsg: true
            }
          })
        );

        // Update field value with new value in store
        // We want to save trimmed value in store for name, email etc
        // So that when other actions read the latest value of any field they
        // have the latest value
        dispatch (updateInfoBotFieldValue ({
          value: updatedFieldVal.value,
          errorMsg: ""
        }));

        dispatch (changeInfoBotCurrentField ());

        const newState = getState ();

        // If all info bot fields are asked, move to next pre-chat feature,
        // otherwise ask next info bot field.
        if (!newState.chatView.infoBot.currentField) {
          dispatch (setChatViewFooter (ACTIVE_FOOTER.BLOCKED));
          dispatch (startNextPreChatFeature ());
        } else {
          dispatch (
            updatePreChatFeatureState ("infoBot", INFO_BOT_STATE.CURRENT_FIELD_TO_BE_ASKED)
          );
          dispatch (askInfoBotField ());
        }
      };
    };

    /**
     * Action to increment pre-chat features index.
     * @returns {Object} - Action
     */
    const incrementPreChatFeatureIndex = () => {
      return {
        type: ACTION_TYPES.INCREMENT_PRE_CHAT_FEATURE_INDEX
      };
    };

    /**
     * Action to start next pre-chat feature.
     * Mark current pre chat feature as complete, and start next feature.
     * @returns {Object} - Action
     */
    const startNextPreChatFeature = () => {
      return (dispatch, getState) => {
        const {preChatFeatureOrder, preChatFeatureIndex} = getState ().appState;
        const feature = preChatFeatureOrder [preChatFeatureIndex];

        dispatch (
          batchActions ([
            updatePreChatFeatureState (feature, PRE_CHAT_STATE [feature].COMPLETED),
            incrementPreChatFeatureIndex ()
          ])
        );
        dispatch (startPreChatFeature ());
      };
    };

    /**
     * Action to start current pre chat feature.
     * If all pre-chat features are completed, create new issue.
     * @returns {Function} - Action
     */
    const startPreChatFeature = () => {
      return (dispatch, getState) => {
        const {appState} = getState ();
        const {
          preChatFeatureOrder,
          featuresEnabled,
          preChatFeatureIndex,
          executeGreetingMessage,
          dummyIssueId
        } = appState;

        // If the preChatFeatureIndex has reached the length of preChatFeatureOrder list,
        // it means all the pre-chat features are executed and create new issue.
        if (preChatFeatureIndex >= preChatFeatureOrder.length) {
          dispatch (registerUserAndCreateIssue ());
          return;
        }

        let feature = preChatFeatureOrder [preChatFeatureIndex];

        // Check if we need to execute greeting message pre chat feature. Refer
        // appState.rehydrate () for explanation of when executing greeting
        // message is needed.
        // If so,
        // set current feature to execute to `greeting`
        // set the greeting message feature state to initial, so that it executes
        // set pre chat feature index to greeting message's index i.e. 0
        // set executeGreetingMessage in the app state to false
        // clear existing greeting message (or any other message)
        if (executeGreetingMessage) {
          feature = PRE_CHAT_FEATURES.GREETING;
          dispatch (batchActions ([
            updatePreChatFeatureState (PRE_CHAT_FEATURES.GREETING, GREETING_STATE.INITIAL),
            actionCreators.setPreChatFeatureIndex (
              preChatFeatureOrder.indexOf (PRE_CHAT_FEATURES.GREETING)
            ),
            actionCreators.setExecuteGreetingMessage (false),
            setMessages (dummyIssueId, [])
          ]));
        }

        if (featuresEnabled [feature]) {
          // If the feature is enabled, start the feature.
          dispatch (startFeature (feature));
        } else {
          // If the feature is disabled, start the next feature.
          dispatch (startNextPreChatFeature ());
        }
      };
    };

    /**
     * Action to register user profile and create new issue.
     * @returns {Function} - action
     */
    const registerUserAndCreateIssue = () => {
      return (dispatch, getState) => {
        const state = getState (),
              infoBotData = state.chatView.infoBot.data,
              name = infoBotData [INFO_BOT_FIELDS.NAME].value.value,
              email = infoBotData [INFO_BOT_FIELDS.EMAIL].value.value;

        const user = {
          identifier: state.appState.identifier
        };

        if (name) {
          user.name = name;
        }
        if (email) {
          user.email = email;
        }

        registerUserProfile (user, state.appState.domain, {
          onSuccess: (response) => {
            dispatch (actionCreators.setUserProfileId (response ["profile-id"]));
            dispatch (createIssue ());
          }
        });
      };
    };

    /**
     * Action to start a particular feature.
     * @returns {Object} - Action
     */
    const startFeature = (feature) => {
      return (dispatch) => {
        switch (feature) {
          case "greeting":
            dispatch (addGreetingMessage ());
            break;
          case "initialUserMessage":
            dispatch (startInitialUserMsgPreChatFeature ());
            break;
          case "answerBot":
            dispatch (startAnswerBot ());
            break;
          case "infoBot":
            dispatch (startInfoBot ());
            break;
        }
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
            activeIssueId
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
      getFaqSuggestions,
      addMessages,
      setMessages,
      setActiveIssueId,
      setChatViewFooter,
      startPreChatFeature,
      updateInfoBotFieldValue,
      submitInfoBotField,
      updateIssueState,
      markMessagesSeen,
      switchToChatView,
      createInitialUserMessage,
      registerUserProfile,
      startNextPreChatFeature,
      createAttachmentMessages,
      createAttachmentMessage,
      showPostIssueResolutionFooter,
      acceptResolutionQuestion,
      rejectResolutionQuestion,
      setUserInputData,
      updateUserInputData,
      setUserSelectedOption
    };
  });
