/**
 * Chat view reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/chatView",
  [
    "constants/chatView",
    "constants/actionTypes",
    "gunpowder/utils/object",
    "gunpowder/utils/array"
  ],
  function (CHAT_VIEW_CONSTANTS, ACTION_TYPES, objUtils, arrayUtils) {
    "use strict";

    const update = React.addons.update;
    const {
      ACTIVE_FOOTER,
      USER_INPUT_TYPES,
      CURSOR_TYPES
    } = CHAT_VIEW_CONSTANTS;

    const INITIAL_ERROR_STATE = {
      type: "",
      title: "",
      subtitle: "",
      cta: ""
    };

    /**
     * Returns default user input config object to be set in store
     * @returns {Object} - input config object
     */
    const _getDefaultUserInputConfig = () => {
      return {
        value: "",
        defaultInputValue: "",
        type: USER_INPUT_TYPES.DEFAULT_INPUT,
        disabled: false,
        required: true,
        options: null,
        selectedOption: null,
        label: "",
        skipLabel: "",
        skipped: false,
        placeholder: "",
        errorMsg: "",
        listPicker: {
          closed: true,
          searchPlaceholder: "",
          searchNoResultsText: ""
        }
      };
    };

    /**
     * Return a union of existing messageList and new messages
     * @param {Array} existingMessageList - Existing list of messages
     * @param {Array} newMessageList - New messages to be added
     * @returns {Array} list of unique messages
     */
    const _getUniqueMessages = (existingMessageList, newMessageList) => {
      const msgIdsAdded = existingMessageList.map ((msg) => msg.id);
      const msgsToAdd = newMessageList.filter ((msg) => {
        return msgIdsAdded.indexOf (msg.id) === -1;
      });

      return msgsToAdd;
    };

    /**
     * Predicate to return whether user input type is default input
     * @param {Object} state - current state
     * @returns {Boolean} - whether current input type is default input
     */
    const isInputTypeDefault = (state) => {
      return (state.userInput.type === USER_INPUT_TYPES.DEFAULT_INPUT);
    };

    const INITIAL_STATE = {
      userInput: _getDefaultUserInputConfig (),
      activeFooter: ACTIVE_FOOTER.REPLY,
      activeIssueMsgCursor: null,
      systemTyping: false,
      agentTyping: false,
      unreadMessageIds: [],
      botState: {
        botStepInProgress: false,
        botStepMessage: null
      },
      messageList: [],
      messageCursor: {
        [CURSOR_TYPES.FORWARD]: {
          value: "",
          meta: {
            issueType: "",
            issueId: ""
          }
        },
        [CURSOR_TYPES.BACKWARD]: {
          value: "",
          meta: {
            issueType: "",
            issueId: "",
            preIssueId: ""
          }
        }
      },
      userIsViewingPastMessages: false,
      userIsRedacted: false,
      allMessagesAreLoaded: false,
      latestConversationHasLoaded: false,
      pastConversationsLoading: false,
      issueCursor: 0,
      pollerFailureCount: 0,
      isCsatSubmitted: false,
      readFaqList: [],
      loading: true,
      // This represents the error in the whole chat view
      // @TODO: Move the error handling to the error reducer.
      error: INITIAL_ERROR_STATE
    };

    /**
     * Returns the index of message for given message id
     * @param {Array} list - list of messages
     * @param {String} id - message id
     * @returns {Number} - index of matched message
     */
    const _getMessageIndex = (list, id) => {
      return arrayUtils.findIndexByKey (list, id, "id");
    };

    return (state = INITIAL_STATE, action) => {
      let userInputUpdateObj = {};
      let index = null;

      switch (action.type) {
        case ACTION_TYPES.REHYDRATE:
          const updateObj = {};
          if (action.data.readFaqList) {
            updateObj.readFaqList = {$set: action.data.readFaqList};
          }
          return update (state, updateObj);

        case ACTION_TYPES.UPDATE_REPLY_TEXT:
          return update (state, {
            userInput: {
              value: {$set: action.value},
              // Save user entered text for input type default input
              defaultInputValue: {
                $set: isInputTypeDefault (state) ? action.value :
                      state.userInput.defaultInputValue
              },
              errorMsg: {$set: ""}
            }
          });

        case ACTION_TYPES.SET_ACTIVE_ISSUE_MSG_CURSOR:
          const {
            cursorTs,
            issueType,
            issueId,
            preIssueId,
            cursorType
          } = action.msgCursor;

          return update (state, {
            messageCursor: {
              [cursorType]: {
                value: {$set: cursorTs},
                meta: {
                  issueType: {$set: issueType},
                  issueId: {$set: issueId},
                  preIssueId: {$set: preIssueId}
                }
              }
            }
          });

        case ACTION_TYPES.SET_CHAT_VIEW_FOOTER:
          if (action.footer === ACTIVE_FOOTER.REPLY &&
              state.activeFooter !== ACTIVE_FOOTER.REPLY) {
            userInputUpdateObj = _getDefaultUserInputConfig ();
          }

          return update (state, {
            activeFooter: {$set: action.footer},
            userInput: {$merge: userInputUpdateObj}
          });

        case ACTION_TYPES.DISABLE_REPLY_BOX:
          return update (state, {
            userInput: {
              disabled: {$set: true}
            }
          });

        case ACTION_TYPES.ENABLE_REPLY_BOX:
          return update (state, {
            userInput: {
              disabled: {$set: false}
            }
          });

        case ACTION_TYPES.SET_LATEST_CONVERSATION_HAS_LOADED:
          return update (state, {
            latestConversationHasLoaded: {$set: true}
          });

        case ACTION_TYPES.TOGGLE_SYSTEM_TYPING:
          return update (state, {
            systemTyping: {$set: action.typing}
          });

        case ACTION_TYPES.TOGGLE_CONVERSATIONS_LOADER:
          return update (state, {
            pastConversationsLoading: {$set: action.loading}
          });

        case ACTION_TYPES.TOGGLE_AGENT_TYPING:
          return update (state, {
            agentTyping: {$set: action.typing}
          });

        case ACTION_TYPES.SET_UNREAD_MESSAGE_IDS:
          return update (state, {
            unreadMessageIds: {$set: action.messageIds}
          });

        case ACTION_TYPES.UPDATE_READ_FAQ_LIST:
          return update (state, {
            readFaqList: {$push: [action.faqId]}
          });

        case ACTION_TYPES.SET_USER_INPUT_DATA:
          userInputUpdateObj = objUtils.shallowMerge (
            _getDefaultUserInputConfig (),
            action.input
          );
          // When the default input switches to bot input, save default input value
          userInputUpdateObj.defaultInputValue = state.userInput.defaultInputValue;
          return update (state, {
            userInput: {$set: userInputUpdateObj}
          });

        case ACTION_TYPES.SET_ALL_MESSAGES_ARE_LOADED:
          return update (state, {
            allMessagesAreLoaded: {$set: action.msgsLoaded}
          });

        case ACTION_TYPES.SET_USER_IS_REDACTED:
          return update (state, {
            userIsRedacted: {$set: true}
          });

        case ACTION_TYPES.RESET_USER_INPUT_DATA:
          userInputUpdateObj = objUtils.shallowMerge (
            _getDefaultUserInputConfig (), {
              // Restore default input value when user input is reset
              value: state.userInput.defaultInputValue
            }
          );
          return update (state, {
            userInput: {$set: userInputUpdateObj}
          });

        case ACTION_TYPES.UPDATE_USER_INPUT_DATA:
          return update (state, {
            userInput: {$merge: action.input}
          });

        case ACTION_TYPES.SET_USER_SELECTED_OPTION:
          return update (state, {
            userInput: {
              selectedOption: {$set: action.option}
            }
          });

        case ACTION_TYPES.TOGGLE_LIST_PICKER:
          return update (state, {
            userInput: {
              listPicker: {
                closed: {$set: action.closed}
              }
            }
          });

        case ACTION_TYPES.SET_USER_VIEWING_PAST_MESSAGES:
          return update (state, {
            userIsViewingPastMessages: {$set: action.isViewing}
          });

        case ACTION_TYPES.APPEND_MESSAGES:
          return update (state, {
            messageList: {$push: _getUniqueMessages (state.messageList, action.messages)}
          });

        case ACTION_TYPES.PREPEND_MESSAGES:
          const uniqMessages = _getUniqueMessages (state.messageList, action.messages);
          const newMessageList = uniqMessages.concat (state.messageList);

          return update (state, {
            messageList: {$set: newMessageList}
          });

        case ACTION_TYPES.REMOVE_MESSAGE:
          index = _getMessageIndex (state.messageList, action.messageId);
          return update (state, {
            messageList: {$splice: [[index, 1]]}
          });

        case ACTION_TYPES.SET_ATTACHMENT_ERROR:
          index = _getMessageIndex (state.messageList, action.messageId);
          return update (state, {
            messageList: {
              [index]: {
                states: {
                  uploadInProgress: {$set: false},
                  error: {$set: true},
                  errorCode: {$set: action.errorCode}
                }
              }
            }
          });

        case ACTION_TYPES.SET_ISSUE_CURSOR:
          return update (state, {
            issueCursor: {$set: action.cursor}
          });

        case ACTION_TYPES.SET_CSAT_SUBMITTED:
          return update (state, {
            isCsatSubmitted: {$set: action.submitted}
          });


        case ACTION_TYPES.SET_POLLER_FAILURE_COUNT:
          return update (state, {
            pollerFailureCount: {$set: action.count}
          });

        case ACTION_TYPES.TOGGLE_CHAT_VIEW_LOADING:
          return update (state, {
            loading: {$set: action.loading}
          });

        case ACTION_TYPES.SET_CHAT_VIEW_ERROR:
          return update (state, {
            error: {$set: action.error}
          });

        case ACTION_TYPES.RESET_CHAT_VIEW_ERROR:
          return update (state, {
            error: {$set: INITIAL_ERROR_STATE}
          });

        case ACTION_TYPES.SET_BOT_STEP_IN_PROGRESS:
          return update (state, {
            botState: {
              botStepInProgress: {$set: action.inProgress}
            }
          });

        case ACTION_TYPES.SAVE_BOT_STEP_MESSAGE:
          return update (state, {
            botState: {
              botStepMessage: {$set: action.message}
            }
          });

        case ACTION_TYPES.RESET:
          return INITIAL_STATE;

        default:
          return state;
      }
    };
  }
);
