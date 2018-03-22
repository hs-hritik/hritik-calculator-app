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
    analyticsConstants, xhr, arrayUtils, schema, objUtils, uuidGenerator, entitiesActions,
    batchActions, actionCreators, entitySchema, entityHelpers, chatViewHelpers,
    xhrHelpers, audioHelpers, liveUpdatesHelpers, attachmentsHelpers,
    analyticsHelpers, commonHelpers, postSdkMessage, browserUtils, upload) {
    "use strict";

    const {normalize} = normalizr,
          MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE,
          {TYPING_TIMEOUT} = MESSAGE_CONSTANTS,
          MESSAGES_TIMEOUT = MESSAGE_CONSTANTS.TIMEOUT,
          MESSAGES_ORIGIN = MESSAGE_CONSTANTS.ORIGIN,
          MESSAGES_STATE = MESSAGE_CONSTANTS.STATE,
          {
            ACTIVE_FOOTER,
            MESSAGES_POLLING_TIMEOUT,
            MESSAGES_FORCE_POLLING_TIMEOUT,
            INFO_BOT_FIELDS,
            USER_INPUT_TYPES
          } = CHAT_VIEW_CONSTANTS,
          {Input} = schema;

    const {FILE_UPLOAD_ERRORS} = ERROR_CONSTANTS;
    const {
      ISSUE_STATE,
      ISSUE_TYPE,
      PRE_CHAT_STATE,
      PRE_CHAT_FEATURES
    } = APP_STATE_CONSTANTS;

    const GREETING_STATE = PRE_CHAT_STATE.greeting,
          USER_MESSAGE_STATE = PRE_CHAT_STATE.initialUserMessage,
          ANSWER_BOT_STATE = PRE_CHAT_STATE.answerBot,
          INFO_BOT_STATE = PRE_CHAT_STATE.infoBot;

    const {EVENT} = analyticsConstants;

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
        const {appState, chatView} = getState ();

        if (chatView.unreadCount !== 0) {
          dispatch (setUnreadCount (0));
          postSdkMessage.updateUnreadCount (0);
        }

        xhr ({
          route: routes.putMessagesSeen (appState.domain, appState.activeIssueId),
          data: {
            identifier: appState.identifier
          },
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
     * @param {Object} config - config required to handle post chat features
     * @param {Boolean} config.isCsatSubmitted - csat rating submitted
     */
    const handlePostChatFeatureSteps = (config) => {
      const {dispatch} = store;
      const {isCsatSubmitted} = config;
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
     * Handles message input
     * Parse the input data for message and save it in store
     * Set the footer depending on input type
     * @param {Object} message - message object
     */
    const handleMessageInput = (message) => {
      const {input} = message;

      if (!input) {
        return;
      }

      const processedUserInput = chatViewHelpers.getProcessedUserInput ({
        messageType: message.type,
        input
      });

      store.dispatch (
        batchActions ([
          setUserInputData (processedUserInput),
          setChatViewFooter (ACTIVE_FOOTER.REPLY),
          toggleSystemTyping (false)
        ])
      );
    };

    /**
     * Handle non renderable message
     * Non renderable messages are not rendered on the UI but
     * used to take certain actions depending on type.
     * @param {String} messageType - type of message
     */
    const handleNonRenderableMessage = (messageType) => {
      if (messageType === MESSAGE_TYPE.BOT_STARTED) {
        store.dispatch (toggleSystemTyping (true));
      } else if (messageType === MESSAGE_TYPE.BOT_ENDED) {
        store.dispatch (setChatViewFooter (ACTIVE_FOOTER.REPLY));
      }
    };

    /**
     * Handle latest message for bot input and take actions
     * @param {Object} latestMessage - latest message in message list
     */
    const handleLatestMessage = (latestMessage) => {
      const {type} = latestMessage;

      if (chatViewHelpers.isNonRenderableMessage (type)) {
        handleNonRenderableMessage (type);
      } else {
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
     * Returns active issue and list of messages
     * @param {Array} issues - list of issues
     * @returns {Object} - config of active issue and messages
     */
    const getActiveIssueAndMessages = (issues) => {
      const currentIssue = issues [0];
      const currentIssueMessages = (currentIssue && currentIssue.messages) || [];
      let previousIssue = null;
      let previousIssueMessages = [];

      // If current issue type is 'issue', find pre issue from issues list
      // and save it in previous
      if (currentIssue && currentIssue.type === ISSUE_TYPE.ISSUE) {
        previousIssue = arrayUtils.find (issues, (issue) => {
          return (issue.type === ISSUE_TYPE.PRE_ISSUE &&
                  issue.id === currentIssue.preissue_id);
        });
        previousIssueMessages = (previousIssue && previousIssue.messages) || previousIssueMessages;
      }

      return {
        activeIssue: currentIssue,
        messages: previousIssueMessages.concat (currentIssueMessages)
      };
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
          domain
        },
        chatView: {
          messageCursor,
          issueCursor
        }
      } = store.getState ();

      // @TODO - Confirm with backend, do we need to send both cursors?
      const xhrData = {
        mc: messageCursor
      };

      if (issueCursor) {
        xhrData.since = issueCursor;
      }

      lastFetchStartTime = Date.now ();
      lastFetchCompleted = false;

      fetchMessagesXhr = xhr ({
        route: routes.getIssuesAndMessages (domain),
        data: xhrHelpers.getPreparedXhrData (xhrData),
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
          // @NOTE - This is to make sure that onEnd is called even if
          // any code in onSuccess results in an Exception.
          try {
            const {
              issues = []
            } = response;

            const {
              activeIssue,
              messages
            } = getActiveIssueAndMessages (issues);

            // Validation to check latest issue exists
            if (!activeIssue) {
              return;
            }

            dispatch (setIssueCursor (response.timestamp));

            const {
              id: issueId,
              type: issueType,
              state_data: {
                state: issueState
              },
              csat_received: isCsatSubmitted,
              created_at: latestMessageCursor
            } = activeIssue;

            const messagesLength = messages.length;
            if (messagesLength) {
              handleLatestMessage (messages [messagesLength - 1]);
              dispatch (
                batchActions ([
                  addMessages ({
                    messages: messages
                  }),
                  setActiveIssueMsgCursor ({
                    [issueType]: {
                      [issueId]: latestMessageCursor
                    }
                  })
                ])
              );
              handleUnreadMessages ();
            }

            // If issue is resolved or rejected, stop polling and ask user for feedback.
            if (issueState === ISSUE_STATE.RESOLVED || issueState === ISSUE_STATE.REJECTED) {
              dispatch (updateIssueState (issueState));
              stopPollingForMessages ();

              if (issueState === ISSUE_STATE.RESOLVED) {
                handlePostChatFeatureSteps ({isCsatSubmitted});
                dispatch (showPostIssueResolutionFooter ());
              }
            }
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
     * Handle unread messages
     * Calculate unread (agent) message count by checking each message
     * If the widget is minimized, post message to parent with unread count which
     * will show unread notification on widget
     */
    const handleUnreadMessages = () => {
      const {dispatch, getState} = store;
      const {state} = getState ();
      const {
        appState: {
          minimized,
          activeView
        },
        chatView: {
          unreadCount,
          messageList: messages
        }
      } = state;
      let finalUnreadCount = unreadCount;

      // Calculate unread count for agent messages only
      messages.forEach ((msg) => {
        if (msg.origin === MESSAGES_ORIGIN.ADMIN &&
            msg.state !== MESSAGES_STATE.READ) {
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

      // @TODO - Confirm why earlier code used activeIssueMsgCursor
      // if (activeIssueMsgCursor && finalUnreadCount) {
      if (finalUnreadCount) {
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
          postChatFeatures: {
            resolutionQuestionCompleted,
            csatCompleted
          },
          featuresEnabled: {
            resolutionQuestion: resolutionQuestionEnabled,
            csatBot: csatBotEnabled
          }
        } = getState ().appState;

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
          dispatch (setChatViewFooter (ACTIVE_FOOTER.START_NEW_CONVERSATION));
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
      const {state} = getState ();
      const {
        chatView: {
          userInput
        },
        appState: {
          domain,
          activeIssueId,
          issueState
        }
      } = state;
      const {
        msgBody,
        msgType,
        onSuccess,
        onEnd
      } = config;
      let xhrData = {};

      if (userInput.type === USER_INPUT_TYPES.DEFAULT_INPUT) {
        // @TODO - Change request params after apis are changed.
        // Currently the request params for issue remains same, only pre-issue
        // params are different.
        xhrData = {
          "message-body": msgBody,
          "message-type": msgType
        };
      } else {
        const latestMessage = getLatestMessage ();
        xhrData = chatViewHelpers.getPreparedMessageData ({
          input: userInput,
          messageType: latestMessage.type
        });
      }

      const route = (issueState === ISSUE_STATE.PRE_CHAT) ?
        routes.postUserReplyForIssue (domain, activeIssueId) :
        routes.postUserReplyForPreIssue (domain, activeIssueId);

      xhr ({
        route,
        data: xhrHelpers.getPreparedXhrData (xhrData),
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
          // @TODO: Handler failure.
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

        if (userInput.disabled || !trimmedValue) {
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

        // @TODO - Find a place to track conversation started event
        // Track the conversation started event.
        // analyticsHelpers.track (EVENT.CONVERSATION_STARTED);

        dispatch (disableReplyBox ());

        postUserMessage ({
          msgBody: userInput.value,
          msgType: MESSAGE_TYPE.TEXT,
          onSuccess: () => {
            handleIssueReopen (issueState);
            dispatch (updateReplyText (""));
            audioHelpers.playSend ();
          },
          onEnd: () => {
            dispatch (enableReplyBox ());
          }
        });

        // Track message added event.
        // @TODO: Check if this needs to be tracked when the add message XHR
        // succeeds. That should not be the case so as to be aligned to the
        // end user's first message event (conversation started) tracking, which
        // is tracked as soon as it's added.
        analyticsHelpers.track (EVENT.MESSAGE_ADDED);
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

            // Track the issue created event.
            analyticsHelpers.track (EVENT.ISSUE_CREATED);
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
            }
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

        // @TODO: Check how are we going to send name with create-pre-issue XHR.
        // Discussion still going on with backend.

        xhr ({
          route: routes.postPreIssue (domain),
          data: xhrHelpers.getPreparedXhrData (xhrData),
          headers: xhrHelpers.getCommonHeaders (),
          method: "POST",
          onSuccess: (response) => {
            const newIssueId = response.id;
            dispatch (
              batchActions ([
                addMessages ({
                  messages: response.messages
                }),
                setActiveIssueId (newIssueId),
                actionCreators.setInternalIssueId (response.internal_id),
                // @TODO: Double check how are we going to maintain issue and pre-issue states.
                updateIssueState (ISSUE_STATE.ACTIVE),
                setChatViewFooter (ACTIVE_FOOTER.REPLY)
              ])
            );
            startPollingForMessages ();

            // Track the issue created event.
            // @TODO: Confirm if issue created event has to be tracked from Web Chat.
            analyticsHelpers.track (EVENT.ISSUE_CREATED);
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
     * Action to reject FAQ suggestions.
     * @returns {Object} - action
     */
    const rejectFaqSuggestions = () => {
      return (dispatch, getState) => {
        const state = getState ();

        dispatch (
          createMessage ({
            type: MESSAGE_TYPE.TEXT,
            messageConfig: {
              body: state.ui.text.labelYes,
              isCustomerMsg: true
            }
          })
        );
        dispatch (setChatViewFooter (ACTIVE_FOOTER.BLOCKED));
        dispatch (startNextPreChatFeature ());

        // Track issue deflection failure event here.
        analyticsHelpers.track (EVENT.ISSUE_DEFLECTION, {
          deflected: false
        });
      };
    };

    /**
     * Action to accept FAQ suggestions.
     * @returns {Object} - Action
     */
    const acceptFaqSuggestions = () => {
      return (dispatch, getState) => {
        const state = getState ();

        dispatch (
          createMessage ({
            type: MESSAGE_TYPE.TEXT,
            messageConfig: {
              body: state.ui.text.labelNo,
              isCustomerMsg: true
            }
          })
        );

        dispatch (
          createMessage ({
            type: MESSAGE_TYPE.TEXT,
            typingTimer: TYPING_TIMEOUT.FAQ_SUGGESTIONS_PROBLEM_SOLVED,
            playAudio: true,
            messageConfig: {
              body: state.ui.text.problemSolvedByFaqSuggestionsMsg,
              isCustomerMsg: false
            }
          })
        );

        dispatch (
          batchActions ([
            updateIssueState (ISSUE_STATE.RESOLVED_BY_FAQ_SUGGESTIONS),
            setChatViewFooter (ACTIVE_FOOTER.START_NEW_CONVERSATION)
          ])
        );

        // Track issue deflection successful event here.
        analyticsHelpers.track (EVENT.ISSUE_DEFLECTION, {
          deflected: true
        });
      };
    };


    /**
     * Action to update issue state.
     * @param {String} state - new state.
     * @returns {Object} - action
     */
    const updateIssueState = (state) => {
      return {
        type: ACTION_TYPES.UPDATE_ISSUE_STATE,
        state
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
              // Along with other actions, set a random Conversation ID in the
              // store. Conversation IDs are generated every time the end user
              // posts the first message (manually or set via API), and sent
              // with the payload of every subsequent analytics event.
              dispatch (
                batchActions ([
                  setChatViewFooter (ACTIVE_FOOTER.BLOCKED),
                  setEndUserFirstMessageId (msg.id),
                  updateReplyText (""),
                  actionCreators.setConversationId (uuidGenerator ())
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

                // Track answer bot result event with the returned FAQ IDs
                analyticsHelpers.track (EVENT.ANS_BOT_RESULT, {
                  query: endUserFirstMsg.body,
                  faqIds: faqs.map ((faq) => faq.id)
                });
              },
              onFailure: () => {
                dispatch (toggleSystemTyping (false));
                // If there is any error while fetching faq suggestions,
                // move to next pre chat feature.
                dispatch (startNextPreChatFeature ());
              }
            }));

            // Track answer bot requested event here.
            analyticsHelpers.track (EVENT.ANS_BOT_REQUESTED, {
              query: endUserFirstMsg.body
            });
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

                  // Track info bot requested (started) event here.
                  analyticsHelpers.track (EVENT.INFO_BOT_REQUESTED);
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

        // Track info bot value (name, email, etc) captured event here.
        analyticsHelpers.track (EVENT.INFO_BOT_FIELD_CAPTURED);

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
        const state = getState ();
        const {appState} = state;
        const {domain, activeIssueId, identifier} = appState;
        const {file, attachmentMsgId} = config;

        upload ({
          route: routes.postUserReply (domain, activeIssueId),
          formData: {
            "identifier": identifier,
            "issue-id": appState.activeIssueId,
            "message-type": MESSAGE_TYPE.ATTACHMENT
          },
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

        // Track message added event.
        // @TODO: Check if this needs to be tracked when the add message XHR
        // succeeds. That should not be the case so as to be aligned to the
        // end user's first message event (conversation started) tracking, which
        // is tracked as soon as it's added.
        analyticsHelpers.track (EVENT.MESSAGE_ADDED);
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
      return (dispatch, getState) => {
        const {ui} = getState ();

        postUserMessage ({
          msgBody: ui.text.chatViewAcceptedTheSolution,
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
      return (dispatch, getState) => {
        const {ui} = getState ();

        postUserMessage ({
          msgBody: ui.text.chatViewRejectedTheSolution,
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
      rejectFaqSuggestions,
      acceptFaqSuggestions,
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
