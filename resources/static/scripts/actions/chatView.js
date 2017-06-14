/**
 * Chat view actions.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 12, 2017
 */

define ("actions/chatView",
  [
    "constants/actionTypes",
    "constants/routes",
    "gunpowder/utils/xhr",
    "actions/entities",
    "normalizr",
    "helpers/entitySchema",
    "constants/message",
    "helpers/entity"
  ],
  function (ACTION_TYPES, routes, xhr, entitiesActions, normalizr,
    entitySchema, MESSAGE_CONSTANTS, entityHelpers) {
    "use strict";

    const {normalize} = normalizr;
    const MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE;

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
     * Action to add new message.
     * @param {String} issueId - issue id
     * @param {String} msgId - message id
     * @returns {Object} - action
     */
    const addMessage = (issueId, msgId) => {
      return {
        type: ACTION_TYPES.ADD_MESSAGE,
        issueId,
        msgId
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

        // @TODO: Update code to send attachments.

        xhr ({
          route: routes.userReply (appState.domain, appState.activeIssueId),
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
            dispatch (addMessage (appState.activeIssueId, response.id));
          },
          onFailure: () => {
            // @TODO: Handler failure.
          }
        });
      };
    };

    return {
      udpateReplyText,
      submitReply
    };
  });
