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
          {ACTIVE_FOOTER, MESSAGES_POLLING_TIMEOUT, INFO_BOT_FIELDS} = CHAT_VIEW_CONSTANTS,
          {Input} = schema;

    const {FILE_UPLOAD_ERRORS} = ERROR_CONSTANTS;
    const {
      ISSUE_STATE,
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
        fetchMessagesTimer = null;

    /**
     * Action to update reply text.
     * @param {String} value - new reply value.
     * @returns {Object} - action
     */
    const udpateReplyText = (value) => {
      return {
        type: ACTION_TYPES.UPDATE_REPLY_TEXT,
        value
      };
    };

    /**
     * Action to add messages to an issue.
     * This action will push given messages to the issue's messages array.
     * @param {String} issueId - issue id
     * @param {Array} msgIds - array of message ids
     * @returns {Object} - action
     */
    const addMessages = (issueId, msgIds) => {
      return {
        type: ACTION_TYPES.ADD_MESSAGES,
        issueId,
        msgIds
      };
    };

    /**
     * Action to set messages to an issue.
     * This action will replace the current messages array with the
     * given messages array. If you want to push messages to an issue,
     * use addMessages action.
     * @param {String} issueId - issue id
     * @param {Array} msgIds - array of message ids
     * @returns {Object} - action
     */
    const setMessages = (issueId, msgIds) => {
      return {
        type: ACTION_TYPES.SET_MESSAGES,
        issueId,
        msgIds
      };
    };

    /**
     * Start polling for messages.
     */
    const startPollingForMessages = () => {
      pollingEnabled = true;
      fetchMessages ();

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

      window.clearTimeout (fetchMessagesTimer);

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
     * Xhr to fetch active issue messages.
     * On success, add messages to the store and also update the active
     * issue message cursor.
     * If polling is enabled, call itself when the xhr ends.
     */
    const fetchMessages = () => {
      const state = store.getState (),
            {dispatch} = store,
            {appState} = state;

      const xhrData = {
        "identifier": appState.identifier,
        "new-timestamp": Date.now ()
      };

      if (state.chatView.activeIssueMsgCursor) {
        xhrData ["messages-cursor"] = state.chatView.activeIssueMsgCursor;
      }

      fetchMessagesXhr = xhr ({
        route: routes.getMessages (appState.domain, appState.activeIssueId),
        data: xhrData,
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
          // @TODO - This is to make sure that onEnd is called even if
          // any code in onSuccess results in an Exception.
          try {
            const latestState = store.getState ();

            if (response.messages.length) {
              const normalizedData = normalize (response, entitySchema.messages);
              const processedEntities = entityHelpers.getProcessedEntities (
                normalizedData.entities
              );

              dispatch (batchActions ([
                entitiesActions.setEntities (processedEntities),
                addMessages (appState.activeIssueId, normalizedData.result.messages),
                setActiveIssueMsgCursor (response.messages_cursor)
              ]));

              let unreadCount = latestState.chatView.unreadCount;
              // Calculate unread count for agent messages only
              response.messages.forEach ((msg) => {
                if (msg.origin === MESSAGES_ORIGIN.ADMIN &&
                    msg.state !== MESSAGES_STATE.READ) {
                  unreadCount++;
                }
              });

              // If the chat view is active, and the messenger is not in minimized state,
              // that means the user has seen the messages.
              if (!latestState.appState.minimized &&
                ACTIVE_VIEW.CHAT === latestState.appState.activeView) {
                dispatch (markMessagesSeen ());
              } else {
                dispatch (setUnreadCount (unreadCount));
                postSdkMessage.updateUnreadCount (unreadCount);
              }

              if (state.chatView.activeIssueMsgCursor && unreadCount) {
                audioHelpers.playReceive ();
              }
            }

            // If issue is resolved or rejected, stop polling and ask user for feedback.
            const issueState = response.issue_state_data.state;
            if (issueState === ISSUE_STATE.RESOLVED || issueState === ISSUE_STATE.REJECTED) {
              dispatch (updateIssueState (issueState));
              stopPollingForMessages ();

              if (issueState === ISSUE_STATE.RESOLVED) {
                dispatch (setChatViewFooter (ACTIVE_FOOTER.CLOSED));

                dispatch (
                  createMessage ({
                    type: MESSAGE_TYPE.END_CHAT,
                    issueId: appState.activeIssueId
                  })
                );

                if (appState.featuresEnabled.csatBot) {
                  dispatch (
                    createMessage ({
                      type: MESSAGE_TYPE.CSAT,
                      issueId: appState.activeIssueId,
                      playAudio: true
                    })
                  );
                }
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
          if (pollingEnabled) {
            fetchMessagesTimer = window.setTimeout (fetchMessages,
                                                    MESSAGES_POLLING_TIMEOUT);
          }
        }
      });
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
     * @param {Object} config - data required for xhr. Required keys:
     *                          domain, activeIssueId, identifier, msgBody, msgType,
     * @param {Object} [callbacks] - optional callbacks
     */
    const postUserMessage = (config, callbacks = {}) => {
      const {domain, activeIssueId, identifier, msgBody, msgType} = config;
      xhr ({
        route: routes.postUserReply (domain, activeIssueId),
        data: {
          identifier,
          "message-body": msgBody,
          "message-type": msgType
        },
        method: "POST",
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
          const normalizedData = normalize (response, entitySchema.message);
          const processedEntities = entityHelpers.getProcessedEntities (normalizedData.entities);

          if (callbacks.onSuccess) {
            callbacks.onSuccess (response, processedEntities);
          }
        },
        onFailure: () => {
          // @TODO: Handler failure.
        },
        onEnd: () => {
          if (callbacks.onEnd) {
            callbacks.onEnd ();
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
        const state = getState (),
              {appState} = state,
              {replyBox} = state.chatView;

        if (replyBox.disabled || !replyBox.value.trim ()) {
          return;
        }

        // If current issue state is rejected, don't fire xhr to send messages to backend.
        if (appState.issueState === ISSUE_STATE.REJECTED) {
          dispatch (
            createMessage ({
              type: MESSAGE_TYPE.TEXT,
              issueId: appState.activeIssueId,
              messageConfig: {
                body: replyBox.value.trim (),
                isCustomerMsg: true
              },
              onAddMessage: () => {
                dispatch (udpateReplyText (""));
              }
            })
          );
          return;
        }

        // If there is no active issue, create user message and add it in dummy issue.
        // TODO: Check for issue state (PRE_CHAT) instead of activeIssueId.
        if (!appState.activeIssueId) {
          // set initial user msg
          dispatch (createInitialUserMessage (replyBox.value));

          // Track the conversation started event.
          analyticsHelpers.track (EVENT.CONVERSATION_STARTED);
          return;
        }

        dispatch (disableReplyBox ());

        postUserMessage ({
          domain: appState.domain,
          activeIssueId: appState.activeIssueId,
          identifier: appState.identifier,
          msgBody: replyBox.value,
          msgType: MESSAGE_TYPE.TEXT
        }, {
          onSuccess: (response, processedEntities) => {
            dispatch (udpateReplyText (""));
            dispatch (entitiesActions.setEntities (processedEntities));
            dispatch (addMessages (appState.activeIssueId, [response.id]));
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
                setActiveIssue (newIssueId),
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
     * Action to set active issue.
     * @param {String} activeIssueId - active issue id.
     * @returns {Object} - action
     */
    const setActiveIssue = (activeIssueId) => {
      return {
        type: ACTION_TYPES.SET_ACTIVE_ISSUE,
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
              body: state.ui.text.faqSuggestionsAdditionalHelpRequiredBtn,
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
              body: state.ui.text.faqSuggestionsAdditionalHelpNotRequiredBtn,
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
            setChatViewFooter (ACTIVE_FOOTER.CLOSED)
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
      return (dispatch, getState) => {
        const {appState} = getState ();
        const {
          type: messageType,
          issueId = appState.dummyIssueId,
          typingTimer = false,
          playAudio = false,
          messageConfig,
          onAddMessage
        } = config;
        const msg = chatViewHelpers.createMessage (messageType, messageConfig);

        // As this message is created on frontend,
        // it is already in normalized and processed format.
        // So, directly udpating the entities in the store.
        const actionsToDispatch = [
          entitiesActions.setEntities ({
            messages: {
              [msg.id]: msg
            }
          }),
          addMessages (issueId, [msg.id])
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
     * @param {Object} config - config required to remove message
     * @param {String} config.issueId - issue id
     * @param {String} config.messageId - message id
     * @returns {Object} - Action
     */
    const removeMessage = (config) => {
      const {issueId, messageId} = config;
      return {
        type: ACTION_TYPES.REMOVE_MESSAGE,
        issueId,
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
                  udpateReplyText (""),
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
            // Track info bot requested (started) event here.
            analyticsHelpers.track (EVENT.INFO_BOT_REQUESTED);
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
            // 1] Parse the response and create msg object
            // 2] Dispatch following actions
            //   a] Remove the message id
            //    - Remove attachment dummy message id from message and issue
            //      entities and local storage
            //   b] Set message entity with parsed msg object
            //   - Store the message in entity store under 'messages'
            //     (check entity reducer)
            //   - This action is also intercepted by lsMiddleware and it
            //   stores the message id in localStorage under 'messages'
            //   c] Add message
            //   - Store the message id in entity store under 'issue->messages'
            //     (check entity reducer)
            //   - lsMiddleware will save message id in localStorage
            //     under 'issues->messages'

            const newMsgId = response.id;
            const normalizedData = normalize (response, entitySchema.message);
            const processedEntities = entityHelpers.getProcessedEntities (normalizedData.entities);
            const msg = processedEntities.messages [newMsgId];

            const actionsToDispatch = [
              removeMessage ({
                issueId: activeIssueId,
                messageId: attachmentMsgId
              }),
              entitiesActions.setEntities ({
                messages: {
                  [msg.id]: msg
                }
              }),
              addMessages (activeIssueId, [msg.id])
            ];
            dispatch (batchActions (actionsToDispatch));
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
     * @param {Object} - File object
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

    return {
      udpateReplyText,
      submitReply,
      startPollingForMessages,
      stopPollingForMessages,
      getFaqSuggestions,
      addMessages,
      setMessages,
      setActiveIssue,
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
      createAttachmentMessage
    };
  });
