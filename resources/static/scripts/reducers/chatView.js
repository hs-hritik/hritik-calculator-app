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
      USER_INPUT_TYPES
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
        errorMsg: ""
      };
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
      unreadCount: 0,
      messageList: [],
      messageCursor: {
        preissues: {},
        issues: {}
      },
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
                $set: isInputTypeDefault (state) ? action.value : ""
              },
              errorMsg: {$set: ""}
            }
          });

        case ACTION_TYPES.SET_ACTIVE_ISSUE_MSG_CURSOR:
          return update (state, {
            messageCursor: {$merge: action.msgCursor}
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

        case ACTION_TYPES.TOGGLE_SYSTEM_TYPING:
          return update (state, {
            systemTyping: {$set: action.typing}
          });

        case ACTION_TYPES.TOGGLE_AGENT_TYPING:
          return update (state, {
            agentTyping: {$set: action.typing}
          });

        case ACTION_TYPES.SET_UNREAD_COUNT:
          return update (state, {
            unreadCount: {$set: action.count}
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
          return update (state, {
            userInput: {$set: userInputUpdateObj}
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

        case ACTION_TYPES.ADD_MESSAGES:
          const msgIdsAdded = state.messageList.map ((msg) => msg.id);
          const msgsToAdd = action.messages.filter ((msg) => {
            return msgIdsAdded.indexOf (msg.id) === -1;
          });

          return update (state, {
            messageList: {$push: msgsToAdd}
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

        case ACTION_TYPES.RESET:
          return INITIAL_STATE;

        default:
          return state;
      }
    };
  }
);
