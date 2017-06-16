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
    "gunpowder/utils/xhr",
    "actions/entities",
    "normalizr",
    "helpers/entitySchema",
    "constants/message",
    "helpers/entity",
    "helpers/chatView"
  ],
  function (store, ACTION_TYPES, routes, xhr, entitiesActions, normalizr,
    entitySchema, MESSAGE_CONSTANTS, entityHelpers, chatViewHelpers) {
    "use strict";

    const {normalize} = normalizr;
    const MESSAGES_POLLING_TIMEOUT = 3000; // milliseconds
    const MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE;

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
          dispatch (udpateReplyText (""));
          // @TODO: Fire faq suggestions xhr.
          // on success create FAQMessage Object.
          // add that message to dummy issue using addMessages
          // Also change the chat view footer, so that user can't send more messages.
          return;
        }

        // @TODO: Update code to send attachments.

        xhr ({
          route: routes.postUserReply (appState.domain, appState.activeIssueId),
          data: {
            "identifier": appState.currentUserId,
            "issue-id": appState.activeIssueId,
            "message-body": replyBox.value,
            "message-type": MESSAGE_TYPE.TEXT
          },
          method: "POST",
          onSuccess: (response) => {
            const normalizedData = normalize (response, entitySchema.message);
            const processedEntities = entityHelpers.getProcessedEntities (normalizedData.entities);

            dispatch (udpateReplyText (""));
            dispatch (entitiesActions.setEntities (processedEntities));
            dispatch (addMessages (appState.activeIssueId, [normalizedData.result]));
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
              successCallback ();
            }
          },
          onFailure: () => {
            // @TODO: Handler failure.
          }
        });
      };
    };

    return {
      udpateReplyText,
      submitReply,
      startPollingForMessages,
      getFaqSuggestions,
      addMessages
    };
  });
