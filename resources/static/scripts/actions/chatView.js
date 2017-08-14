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
    "constants/eventTypes",
    "constants/activeView",
    "constants/message",
    "constants/appState",
    "gunpowder/utils/xhr",
    "gunpowder/utils/array",
    "actions/entities",
    "actions/batch",
    "helpers/entitySchema",
    "helpers/entity",
    "helpers/chatView",
    "helpers/xhr",
    "helpers/localStorage",
    "utils/postMessage"
  ],
  function (store, normalizr, ACTION_TYPES, routes, CHAT_VIEW_CONSTANTS,
    EVENT_TYPES, ACTIVE_VIEW, MESSAGE_CONSTANTS, APP_STATE_CONSTANTS, xhr, arrayUtils,
    entitiesActions, batchActions, entitySchema, entityHelpers,
    chatViewHelpers, xhrHelpers, lsHelper, postMessage) {
    "use strict";

    const {normalize, denormalize} = normalizr,
          MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE,
          MESSAGE_TIMEOUT = MESSAGE_CONSTANTS.TIMEOUT,
          {ACTIVE_FOOTER, MESSAGES_POLLING_TIMEOUT} = CHAT_VIEW_CONSTANTS,
          {ISSUE_STATE, PRE_CHAT_STATE: {GREETING, ANSWER_BOT, INFO_BOT}} = APP_STATE_CONSTANTS;

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
    };

    /**
     * Stop polling for messages.
     * Also clear previous timeout and xhr, if any.
     */
    const stopPollingForMessages = () => {
      window.clearTimeout (fetchMessagesTimer);

      if (fetchMessagesXhr) {
        fetchMessagesXhr.abort ();
        fetchMessagesXhr = null;
      }

      pollingEnabled = false;
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
        const {appState} = getState ();

        // @TODO: Confirm if we should skip this postMessage call if unread count is already zero.
        postMessage (EVENT_TYPES.UPDATE_UNREAD_COUNT, {
          count: 0
        });
        dispatch (setUnreadCount (0));

        xhr ({
          route: routes.putMessagesSeen (appState.domain, appState.activeIssueId),
          data: {
            "identifier": appState.identifier,
            "issue-id": appState.activeIssueId
          },
          method: "PUT",
          headers: xhrHelpers.getCommonHeaders ()
        });
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
        "issue-id": appState.activeIssueId
      };

      if (state.chatView.activeIssueMsgCursor) {
        xhrData ["messages-cursor"] = state.chatView.activeIssueMsgCursor;
      }

      fetchMessagesXhr = xhr ({
        route: routes.getMessages (appState.domain, appState.activeIssueId),
        data: xhrData,
        headers: xhrHelpers.getCommonHeaders (),
        onSuccess: (response) => {
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

            // If the chat view is active, that means the user has seen the messages.
            // @TODO: Set unread count to zero when active view changes to chat.
            if (ACTIVE_VIEW.CHAT === latestState.appState.activeView) {
              dispatch (markMessagesSeen ());
            } else {
              const unreadCount = response.messages.length + latestState.chatView.unreadCount;
              dispatch (setUnreadCount (unreadCount));

              postMessage (EVENT_TYPES.UPDATE_UNREAD_COUNT, {
                count: unreadCount
              });
            }
          }

          // If issue is resolved or rejected, stop polling and ask user for feedback.
          const issueState = response.issue_state_data.state;
          if (issueState === ISSUE_STATE.RESOLVED || issueState === ISSUE_STATE.REJECTED) {
            dispatch (updateIssueState (issueState));
            stopPollingForMessages ();

            if (issueState === ISSUE_STATE.RESOLVED) {
              dispatch (setChatViewFooter (ACTIVE_FOOTER.CLOSED));
              if (appState.featuresEnabled.csatBot) {
                dispatch (
                  createMessage (MESSAGE_TYPE.CSAT, null, {
                    typingTimer: MESSAGE_TIMEOUT.CSAT_REQUEST,
                    issueId: appState.activeIssueId
                  })
                );
              }
            }
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
      xhr ({
        route: routes.postUserReply (config.domain, config.activeIssueId),
        data: {
          "identifier": config.identifier,
          "issue-id": config.activeIssueId,
          "message-body": config.msgBody,
          "message-type": config.msgType
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
     * Action to set end user first message.
     * @returns {Object} - action
     */
    const setEndUserFirstMessage = (msg) => {
      return {
        type: ACTION_TYPES.SET_END_USER_FIRST_MESSAGE,
        msg
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

        if (replyBox.disabled || !replyBox.value) {
          return;
        }

        // If current issue state is rejected, don't fire xhr to send messages to backend.
        if (appState.issueState === ISSUE_STATE.REJECTED) {
          dispatch (
            createMessage (MESSAGE_TYPE.TEXT, {
              body: replyBox.value,
              isCustomerMsg: true
            }, {
              typingTimer: null,
              issueId: appState.activeIssueId,
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
          dispatch (
            createMessage (MESSAGE_TYPE.TEXT, {
              body: replyBox.value,
              isCustomerMsg: true
            }, {
              typingTimer: null,
              issueId: appState.dummyIssueId,
              onAddMessage: (msg) => {
                dispatch (
                  batchActions ([
                    setChatViewFooter (ACTIVE_FOOTER.BLOCKED),
                    setEndUserFirstMessage (msg),
                    udpateReplyText ("")
                  ])
                );

                dispatch (startNextPreChatFeature ());
              }
            })
          );

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
          },
          onEnd: () => {
            dispatch (enableReplyBox ());
          }
        });
      };
    };

    /**
     * Action to reject the solution.
     * @returns {Object} - action
     */
    const rejectSolution = () => {
      return (dispatch, getState) => {
        const state = getState ();
        const appState = state.appState;

        postUserMessage ({
          domain: appState.domain,
          activeIssueId: appState.activeIssueId,
          identifier: appState.identifier,
          msgBody: state.ui.text.rejectSolutionMessage,
          msgType: MESSAGE_TYPE.CONFIRMATION_REJECTED
        }, {
          onSuccess: (response, processedEntities) => {
            dispatch (entitiesActions.setEntities (processedEntities));
            dispatch (addMessages (appState.activeIssueId, [response.id]));
            dispatch (setChatViewFooter (ACTIVE_FOOTER.REPLY));
            startPollingForMessages ();
          }
        });

      };
    };

    /**
     * Action to accept the solution.
     * @returns {Object} - action
     */
    const acceptSolution = () => {
      return (dispatch, getState) => {
        const state = getState ();
        const appState = state.appState;

        postUserMessage ({
          domain: appState.domain,
          activeIssueId: appState.activeIssueId,
          identifier: appState.identifier,
          msgBody: state.ui.text.acceptSolutionMessage,
          msgType: MESSAGE_TYPE.CONFIRMATION_ACCEPTED
        }, {
          onSuccess: (response, processedEntities) => {
            dispatch (entitiesActions.setEntities (processedEntities));
            dispatch (addMessages (appState.activeIssueId, [response.id]));
            dispatch (setChatViewFooter (ACTIVE_FOOTER.CSAT));
          }
        });
      };
    };

    /**
     * Action to update csat rating in store.
     * @param {Number} rating - csat rating
     * @returns {Object} - action
     */
    const updateCSATRating = (rating) => {
      return {
        type: ACTION_TYPES.UPDATE_CSAT_RATING,
        rating
      };
    };

    /**
     * Action to post csat rating and save it in store.
     * @param {Number} rating - csat rating
     * @returns {Object} - action
     */
    const submitCsat = (rating) => {
      return (dispatch, getState) => {
        const state = getState ();
        const appState = state.appState;

        // @TODO: Need UX decision to update the rating on the UI instantly,
        // or wait for xhr response.
        dispatch (updateCSATRating (rating));

        xhr ({
          route: routes.postCSAT (appState.domain, appState.activeIssueId),
          data: {
            "identifier": appState.identifier,
            "issue-id": appState.activeIssueId,
            "platform-id": appState.platformId,
            "rating": rating
          },
          headers: xhrHelpers.getCommonHeaders (),
          method: "POST"
        });
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
        route: routes.postProfile (domain, identifier),
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
        const {dummyIssueId} = appState;
        const dummyIssue = denormalize (
          appState.dummyIssueId,
          entitySchema.issue,
          state.entities
        );

        const firstUserMsg = arrayUtils.find (dummyIssue.messages, (message) => {
          return message.isCustomerMsg;
        });

        dispatch (disableReplyBox ());

        xhr ({
          route: routes.postIssue (appState.domain),
          data: {
            "identifier": appState.identifier,
            "platform-id": appState.platformId,
            "message-body": firstUserMsg.body
          },
          headers: xhrHelpers.getCommonHeaders (),
          method: "POST",
          onSuccess: (response) => {
            const normalizedData = normalize (response, entitySchema.issue);
            const processedEntities = entityHelpers.getProcessedEntities (normalizedData.entities);
            dispatch (entitiesActions.setEntities (processedEntities));

            // Replace frontend created user message with backend message,
            // and add all dummy issue messages to the active issue.
            const dummyIssueMsgIds = state.entities.issues [dummyIssueId].messages.slice ();
            dummyIssueMsgIds.splice (
              dummyIssueMsgIds.indexOf (firstUserMsg.id),
              1,
              response.messages [0].id
            );

            const newIssueId = response.id;
            dispatch (
              batchActions ([
                setMessages (newIssueId, dummyIssueMsgIds),
                // Remove messages from dummy issue
                setMessages (dummyIssueId, []),
                setActiveIssue (newIssueId),
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
      return (dispatch) => {
        dispatch (setChatViewFooter (ACTIVE_FOOTER.BLOCKED));
        dispatch (startNextPreChatFeature ());
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
          createMessage (MESSAGE_TYPE.TEXT, {
            body: state.ui.text.problemSolvedByFaqSuggestionsMessage,
            isCustomerMsg: false
          }, {
            typingTimer: null,
            issueId: state.appState.dummyIssueId
          })
        );

        dispatch (
          batchActions ([
            updateIssueState (ISSUE_STATE.RESOLVED_BY_FAQ_SUGGESTIONS),
            setChatViewFooter (ACTIVE_FOOTER.CLOSED)
          ])
        );
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
     * @param {String} messageType - Message type.
     * @param {Object} config - Data required for creating the message.
     * @param {Object} options - Additional options for the action.
     * @param {String} options.issueId - The issue id to which issue belongs.
     * @param {Number} [options.typingTimer] - If the issue has to be added after sometime,
     *                                         pass the time in milliseconds. Typing indicator
     *                                         would be shown for that time period.
     * @param {Function} [options.onAddMessage] - The callback function to be executed when the
     *                                            message is added to the store.
     * @returns {Object} - Action
     */
    const createMessage = (messageType, config, options) => {
      return (dispatch) => {
        const {typingTimer, issueId, onAddMessage} = options;
        const msg = chatViewHelpers.createMessage (messageType, config);

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
          }, typingTimer);
        } else {
          dispatch (batchActions (actionsToDispatch));
          if (onAddMessage) {
            onAddMessage (msg);
          }
        }
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
          case GREETING.INITIAL:
            const defaultAgentMsgText = state.ui.text.greetingMsg;

            dispatch (
              createMessage (MESSAGE_TYPE.TEXT, {
                body: defaultAgentMsgText,
                isCustomerMsg: false
              }, {
                typingTimer: null,
                issueId: state.appState.dummyIssueId
              })
            );

            dispatch (
              batchActions ([
                setChatViewFooter (ACTIVE_FOOTER.REPLY),
                updatePreChatFeatureState ("greeting", GREETING.WAITING_FOR_USER_REPLY)
              ])
            );
            break;

          case GREETING.WAITING_FOR_USER_REPLY:
            dispatch (setChatViewFooter (ACTIVE_FOOTER.REPLY));
            break;

          case GREETING.COMPLETED:
            startNextPreChatFeature ();
            break;
        }
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
        const {appState, chatView} = getState (),
              featureState = appState.preChatFeatureState.answerBot;

        switch (featureState) {
          case ANSWER_BOT.INITIAL:
            dispatch (toggleSystemTyping (true));
            // Get faq suggestions for the given user message.
            // @TODO: Instead of saving the whole endUserFirstMsg,
            // save only id, and save that in localstorage
            // (to handle the refresh case when faqs are being fetched)
            dispatch (getFaqSuggestions (chatView.endUserFirstMsg.body, {
              onSuccess: (faqs) => {
                // If there are no faq suggestions, move to next pre-chat feature,
                // otherwise create faq message.
                dispatch (toggleSystemTyping (false));
                if (!faqs.length) {
                  dispatch (startNextPreChatFeature ());
                } else {
                  dispatch (
                    createMessage (MESSAGE_TYPE.FAQ, {
                      faqs
                    }, {
                      typingTimer: null,
                      issueId: appState.dummyIssueId,
                      onAddMessage: () => {
                        onFaqSuggestionMessageAdd ();
                        dispatch (updatePreChatFeatureState ("answerBot", ANSWER_BOT.FAQS_FETCHED));
                      }
                    })
                  );
                }
              },
              onFailure: () => {
                // @TODO: Handle faq suggestions xhr failure.
                dispatch (toggleSystemTyping (false));
              }
            }));
            break;

          case ANSWER_BOT.FAQS_FETCHED:
            onFaqSuggestionMessageAdd ();
            break;

          case ANSWER_BOT.WAITING_FOR_USER_FEEDBACK:
            store.dispatch (setChatViewFooter (ACTIVE_FOOTER.FAQ_SUGGESTIONS_FEEDBACK));
            break;

          case ANSWER_BOT.COMPLETED:
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
      store.dispatch (
        createMessage (MESSAGE_TYPE.TEXT, {
          body: state.ui.text.faqSuggestionsAdditionalHelpMessage,
          isCustomerMsg: false
        }, {
          typingTimer: MESSAGE_TIMEOUT.FAQ_SUGGESTIONS_ADDITIONAL_HELP,
          issueId: state.appState.dummyIssueId,
          onAddMessage: () => {
            store.dispatch (
              batchActions ([
                updatePreChatFeatureState ("answerBot", ANSWER_BOT.WAITING_FOR_USER_FEEDBACK),
                setChatViewFooter (ACTIVE_FOOTER.FAQ_SUGGESTIONS_FEEDBACK)
              ])
            );
          }
        })
      );
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
          case INFO_BOT.INITIAL:
            dispatch (
              createMessage (MESSAGE_TYPE.TEXT, {
                body: state.ui.text.infoBotRequestMsg,
                isCustomerMsg: false
              }, {
                typingTimer: MESSAGE_TIMEOUT.INFO_BOT_REQUEST,
                issueId: state.appState.dummyIssueId,
                onAddMessage: () => {
                  dispatch (
                    updatePreChatFeatureState ("infoBot", INFO_BOT.CURRENT_FIELD_TO_BE_ASKED)
                  );
                  dispatch (askInfoBotField ());
                }
              })
            );
            break;

          case INFO_BOT.CURRENT_FIELD_TO_BE_ASKED:
            dispatch (askInfoBotField ());
            break;

          case INFO_BOT.CURRENT_FIELD_ASKED:
            dispatch (setChatViewFooter (ACTIVE_FOOTER.INFO_BOT));
            break;

          case INFO_BOT.COMPLETED:
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
            createMessage (MESSAGE_TYPE.TEXT, {
              body: currentField.msg,
              isCustomerMsg: false
            }, {
              typingTimer: MESSAGE_TIMEOUT.INFO_BOT_FIELD,
              issueId: state.appState.dummyIssueId,
              onAddMessage: () => {
                dispatch (
                  batchActions ([
                    updatePreChatFeatureState ("infoBot", INFO_BOT.CURRENT_FIELD_ASKED),
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

        const currentFieldVal = infoBot.data [infoBot.currentField].value;

        // @TODO: Add validations
        // const errorMsg = currentField.value.isValid ();
        // dispatch (updateInfoBotFieldValue ({
        //   errorMsg
        // }));
        // if (errorMsg) {
        //   return;
        // }

        dispatch (
          createMessage (MESSAGE_TYPE.TEXT, {
            body: currentFieldVal.value,
            isCustomerMsg: true
          }, {
            typingTimer: null,
            issueId: state.appState.dummyIssueId
          })
        );

        dispatch (changeInfoBotCurrentField ());

        const newState = getState ();

        // If all info bot fields are asked, move to next pre-chat feature,
        // otherwise ask next info bot field.
        if (!newState.chatView.infoBot.currentField) {
          dispatch (setChatViewFooter (ACTIVE_FOOTER.BLOCKED));
          dispatch (startNextPreChatFeature ());
        } else {
          dispatch (updatePreChatFeatureState ("infoBot", INFO_BOT.CURRENT_FIELD_TO_BE_ASKED));
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
        // @TODO: Read "COMPLETED" from constant file instead of passing here directly.
        dispatch (
          batchActions ([
            updatePreChatFeatureState (feature, "COMPLETED"),
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
        const {preChatFeatureOrder, featuresEnabled, preChatFeatureIndex} = appState;

        // If the preChatFeatureIndex has reached the length of preChatFeatureOrder list,
        // it means all the pre-chat features are executed and create new issue.
        if (preChatFeatureIndex >= preChatFeatureOrder.length) {
          dispatch (registerUserAndCreateIssue ());
          return;
        }

        const feature = preChatFeatureOrder [preChatFeatureIndex];

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
              name = infoBotData.name.value.value,
              email = infoBotData.email.value.value;

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
          onSuccess: () => {
            // Save the information in the local storage that the current user is registerd.
            // This will help in skipping the info bot if the same user starts a new conversation.
            lsHelper.setIdentifierRegisteredInfo (true);
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
     * Return action to update the active view
     * @param {String} view - update the active view to
     * @returns {Object} - the action object
     */
    // @TODO: Remove this action creator from here to some common place.
    // Adding it temporarily because of dependency issues.
    const updateActiveView = (view) => ({
      type: ACTION_TYPES.UPDATE_ACTIVE_VIEW,
      view
    });

    return {
      udpateReplyText,
      submitReply,
      startPollingForMessages,
      stopPollingForMessages,
      getFaqSuggestions,
      addMessages,
      setMessages,
      rejectSolution,
      acceptSolution,
      submitCsat,
      setActiveIssue,
      setChatViewFooter,
      rejectFaqSuggestions,
      acceptFaqSuggestions,
      startPreChatFeature,
      updateInfoBotFieldValue,
      submitInfoBotField,
      updateIssueState,
      updateActiveView
    };
  });
