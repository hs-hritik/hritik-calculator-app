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
    "helpers/entitySchema",
    "helpers/entity",
    "helpers/chatView"
  ],
  function (store, normalizr, ACTION_TYPES, routes, CHAT_VIEW_CONSTANTS,
    MESSAGE_CONSTANTS, xhr, arrayUtils, entitiesActions, entitySchema,
    entityHelpers, chatViewHelpers) {
    "use strict";

    const {normalize, denormalize} = normalizr;
    const MESSAGES_POLLING_TIMEOUT = 3000; // milliseconds
    const MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE;
    const {ACTIVE_FOOTER} = CHAT_VIEW_CONSTANTS;

    let pollingEnabled = false,
        fetchMessagesXhr = null,
        fetchMessagesTimer = null;

    /**
     * Action to update reply text.
     * @param {Object} value - new reply value.
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
      const state = store.getState ();
      const appState = state.appState;

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
        method: "GET",
        onSuccess: (response) => {
          if (response.messages.length) {
            const normalizedData = normalize (response, entitySchema.messages);
            const processedEntities = entityHelpers.getProcessedEntities (
              normalizedData.entities
            );
            store.dispatch (entitiesActions.setEntities (processedEntities));
            store.dispatch (addMessages (
              appState.activeIssueId,
              normalizedData.result.messages
            ));
            store.dispatch (setActiveIssueMsgCursor (response.messages_cursor));
          }

          // If issue is resolved or rejected, stop polling and ask user for feedback.
          const issueState = response.issue_state_data.state;
          if (issueState === "resolved" || issueState === "rejected") {
            pollingEnabled = false;
            store.dispatch (setChatViewFooter (ACTIVE_FOOTER.ISSUE_FEEDBACK));
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
        onSuccess: (response) => {
          const normalizedData = normalize (response, entitySchema.message);
          const processedEntities = entityHelpers.getProcessedEntities (normalizedData.entities);

          if (callbacks.onSuccess) {
            callbacks.onSuccess (response, processedEntities);
          }
        },
        onFailure: () => {
          // @TODO: Handler failure.
        }
      });
    };

    /**
     * Action to submit reply.
     * @returns {Object} - action
     */
    const submitReply = () => {
      return (dispatch, getState) => {
        const state = getState ();
        const appState = state.appState;
        const replyBox = state.chatView.replyBox;

        // @TODO: Add validations.
        if (replyBox.loading || !replyBox.value) {
          return;
        }

        // If there is no active issue, create user message and add it in dummy issue.
        if (!appState.activeIssueId) {
          const userMsg = chatViewHelpers.createTextMessage (replyBox.value, {
            isCustomerMsg: true
          });

          // As this message is created on frontend,
          // it is already in normalized and processed format.
          // So, directly udpating the entities in the store.
          dispatch (entitiesActions.setEntities ({
            messages: {
              [userMsg.id]: userMsg
            }
          }));
          dispatch (addMessages (appState.dummyIssueId, [userMsg.id]));

          // Get faq suggestions for the given user message.
          // @TODO: Add handler to stop firing multiple xhrs on multiple user messages.
          dispatch (getFaqSuggestions (replyBox.value, (faqs) => {
            const faqMsg = chatViewHelpers.createFaqMessage (faqs);

            dispatch (entitiesActions.setEntities ({
              messages: {
                [faqMsg.id]: faqMsg
              }
            }));

            dispatch (addMessages (appState.dummyIssueId, [faqMsg.id]));
            dispatch (setChatViewFooter (ACTIVE_FOOTER.FAQ_SUGGESTIONS_FEEDBACK));
          }));

          dispatch (udpateReplyText (""));
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
            "platform-id": appState.appId,
            "rating": rating
          },
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

        xhr ({
          route: routes.postIssue (appState.domain),
          data: {
            "identifier": appState.currentUserId,
            "platform-id": appState.appId,
            "message-body": firstUserMsg.body
          },
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
            // @TODO: Remove dummy issue from entities.
            dispatch (setChatViewFooter (ACTIVE_FOOTER.REPLY));
          },
          onFailure: () => {
            // @TODO: Handler failure.
          }
        });
      };
    };

    /**
     * Action to get FAQ suggestions based on the message text.
     * @param {String} searchText - search text to pass on to the API to get FAQs
     * @param {Function} successCallback. The action caller should be responsible
     *                   for handling changes other than setting suggested FAQs to
     *                   the store.
     * @returns {Object} - action
     */
    const getFaqSuggestions = (searchText, successCallback) => {
      return (dispatch, getState) => {
        const state = getState ();
        const appState = state.appState;

        xhr ({
          route: routes.getFaqSuggestions (appState.domain),
          data: {
            text: searchText
          },
          onSuccess: (response) => {
            // The response would contain a list of faq objects,
            // dispatch an action to set it to the store.
            dispatch (setFaqSuggestions (response));
            if (successCallback) {
              successCallback (response);
            }
          },
          onFailure: () => {
            // @TODO: Handler failure.
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

    return {
      udpateReplyText,
      submitReply,
      startPollingForMessages,
      getFaqSuggestions,
      addMessages,
      setMessages,
      createIssue,
      rejectSolution,
      acceptSolution,
      submitCsat,
      setActiveIssue,
      setChatViewFooter
    };
  });
