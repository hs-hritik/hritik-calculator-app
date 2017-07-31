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
    "constants/message",
    "gunpowder/utils/xhr",
    "gunpowder/utils/array",
    "actions/entities",
    "actions/batch",
    "helpers/entitySchema",
    "helpers/entity",
    "helpers/chatView",
    "helpers/xhr"
  ],
  function (store, normalizr, ACTION_TYPES, routes, CHAT_VIEW_CONSTANTS,
    MESSAGE_CONSTANTS, xhr, arrayUtils, entitiesActions, batchActions, entitySchema,
    entityHelpers, chatViewHelpers, xhrHelpers) {
    "use strict";

    const {normalize, denormalize} = normalizr,
          MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE,
          MESSAGE_TIMEOUT = MESSAGE_CONSTANTS.TIMEOUT,
          {ACTIVE_FOOTER, MESSAGES_POLLING_TIMEOUT} = CHAT_VIEW_CONSTANTS;

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
     * Also clear previous polling, if any.
     */
    const startPollingForMessages = () => {
      window.clearTimeout (fetchMessagesTimer);

      if (fetchMessagesXhr) {
        fetchMessagesXhr.abort ();
        fetchMessagesXhr = null;
      }

      pollingEnabled = true;
      fetchMessages ();
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
        "identifier": appState.currentUserId,
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
          if (response.messages.length) {
            const normalizedData = normalize (response, entitySchema.messages);
            const processedEntities = entityHelpers.getProcessedEntities (
              normalizedData.entities
            );
            dispatch (entitiesActions.setEntities (processedEntities));
            dispatch (addMessages (
              appState.activeIssueId,
              normalizedData.result.messages
            ));
            dispatch (setActiveIssueMsgCursor (response.messages_cursor));
          }

          // If issue is resolved or rejected, stop polling and ask user for feedback.
          const issueState = response.issue_state_data.state;
          if (issueState === "resolved" || issueState === "rejected") {
            pollingEnabled = false;
            const {problemSolvedAgentMessage} = state.ui.text;

            dispatch (createMessage (MESSAGE_TYPE.TEXT, {
              body: problemSolvedAgentMessage,
              isCustomerMsg: false
            }, {
              typingTimer: null,
              issueId: appState.activeIssueId
            }));
            dispatch (setChatViewFooter (ACTIVE_FOOTER.ISSUE_FEEDBACK));
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
     * Action to set FAQ suggestions to the store.
     * @param {Array} faqs - List of faq objects
     * @returns {Object} - action
     */
    const setFaqSuggestions = (faqs) => {
      return {
        type: ACTION_TYPES.SET_FAQ_SUGGESTIONS,
        faqs
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
     * @param {Object} config - data required for xhr. Required keys:
     *                          domain, activeIssueId, currentUserId, msgBody, msgType,
     * @param {Object} [callbacks] - optional callbacks
     */
    const postUserMessage = (config, callbacks = {}) => {
      xhr ({
        route: routes.postUserReply (config.domain, config.activeIssueId),
        data: {
          "identifier": config.currentUserId,
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
        dispatch (disableReplyBox ());

        // If there is no active issue, create user message and add it in dummy issue.
        if (!appState.activeIssueId) {
          dispatch (createMessage (MESSAGE_TYPE.TEXT, {
            body: replyBox.value,
            isCustomerMsg: true
          }, {
            typingTimer: null,
            issueId: appState.dummyIssueId
          }));

          dispatch (udpateReplyText (""));
          dispatch (startNextPreChatFeature ());
          return;
        }

        // @TODO: Update code to send attachments.

        postUserMessage ({
          domain: appState.domain,
          activeIssueId: appState.activeIssueId,
          currentUserId: appState.currentUserId,
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
          currentUserId: appState.currentUserId,
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
          currentUserId: appState.currentUserId,
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
            "identifier": appState.currentUserId,
            "issue-id": appState.activeIssueId,
            "platform-id": appState.platformId,
            "rating": rating
          },
          headers: xhrHelpers.getCommonHeaders (),
          method: "POST"
        });
      };
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
            "identifier": appState.currentUserId,
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
            dispatch (setMessages (newIssueId, dummyIssueMsgIds));
            dispatch (setActiveIssue (newIssueId));
            startPollingForMessages ();
            // Remove messages from dummy issue.
            dispatch (setMessages (dummyIssueId, []));
            dispatch (setChatViewFooter (ACTIVE_FOOTER.REPLY));
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
            "app-id": appState.appId
          },
          headers: xhrHelpers.getCommonHeaders (),
          onSuccess: (response) => {
            // The response would contain a list of faq objects,
            // dispatch an action to set it to the store.
            const faqs = response.suggested_faqs;
            dispatch (setFaqSuggestions (faqs));
            if (callbacks.onSuccess) {
              callbacks.onSuccess (faqs);
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

        dispatch (createMessage (MESSAGE_TYPE.TEXT, {
          body: state.ui.text.problemSolvedByFaqSuggestionsMessage,
          isCustomerMsg: false
        }, {
          typingTimer: null,
          issueId: state.appState.dummyIssueId
        }));

        // @TODO: Change state and active footer to closed.
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
              onAddMessage ();
            }
          }, typingTimer);
        } else {
          dispatch (batchActions (actionsToDispatch));
          if (onAddMessage) {
            onAddMessage ();
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
        const state = getState ();
        const defaultAgentMsgText = state.ui.text.greetingMsg;

        dispatch (createMessage (MESSAGE_TYPE.TEXT, {
          body: defaultAgentMsgText,
          isCustomerMsg: false
        }, {
          typingTimer: null,
          issueId: state.appState.dummyIssueId
        }));
        dispatch (setChatViewFooter (ACTIVE_FOOTER.REPLY));
      };
    };

    /**
     * Action to start answer bot workflow (FAQ suggestions).
     * @param {String} searchText - Text for which faq suggestions have to be fetched.
     * @returns {Object} - Action
     */
    const startAnswerBot = (searchText) => {
      return (dispatch, getState) => {
        const {appState} = getState ();

        dispatch (toggleSystemTyping (true));
        // Get faq suggestions for the given user message.
        dispatch (getFaqSuggestions (searchText, {
          onSuccess: (faqs) => {
            // If there are no faq suggestions, move to next pre-chat feature,
            // otherwise create faq message.
            if (!faqs.length) {
              dispatch (startNextPreChatFeature ());
            } else {
              dispatch (createMessage (MESSAGE_TYPE.FAQ, {
                faqs
              }, {
                typingTimer: null,
                issueId: appState.dummyIssueId,
                onAddMessage: onFaqSuggestionMessageAdd
              }));
            }
          },
          onEnd: () => {
            dispatch (batchActions ([
              enableReplyBox (),
              toggleSystemTyping (false)
            ]));
          }
        }));
      };
    };

    /**
     * Callback handler after the faq suggestions message is added.
     */
    const onFaqSuggestionMessageAdd = () => {
      const state = store.getState ();
      store.dispatch (createMessage (MESSAGE_TYPE.TEXT, {
        body: state.ui.text.faqSuggestionsAdditionalHelpMessage,
        isCustomerMsg: false
      }, {
        typingTimer: MESSAGE_TIMEOUT.FAQ_SUGGESTIONS_ADDITIONAL_HELP,
        issueId: state.appState.dummyIssueId,
        onAddMessage: () => {
          store.dispatch (setChatViewFooter (ACTIVE_FOOTER.FAQ_SUGGESTIONS_FEEDBACK));
        }
      }));
    };

    /**
     * Action to start get info bot workflow.
     * @returns {Object} - Action
     */
    const startGetInfoBot = () => {
      return (dispatch) => {
        // @TODO
        dispatch (startNextPreChatFeature ());
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
     * If all pre-chat features are completed, create new issue.
     * @returns {Object} - Action
     */
    const startNextPreChatFeature = () => {
      return (dispatch, getState) => {
        const {appState} = getState ();
        const {preChatfeaturesOrder, featuresEnabled, preChatfeatureIndex} = appState;

        // If the preChatfeatureIndex has reached the length of preChatfeaturesOrder list,
        // it means all the pre-chat features are executed and create new issue.
        if (preChatfeatureIndex >= preChatfeaturesOrder.length) {
          dispatch (createIssue ());
          return;
        }

        const feature = preChatfeaturesOrder [preChatfeatureIndex];
        dispatch (incrementPreChatFeatureIndex ());

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
            // @TODO: Pass end user first msg as param.
            dispatch (startAnswerBot ());
            break;
          case "getInfoBot":
            dispatch (startGetInfoBot ());
            break;
        }
      };
    };

    return {
      udpateReplyText,
      submitReply,
      startPollingForMessages,
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
      startNextPreChatFeature
    };
  });
