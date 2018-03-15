/**
 * Chat view reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/chatView",
  [
    "constants/chatView",
    "constants/actionTypes",
    "gunpowder/utils/object"
  ],
  function (CHAT_VIEW_CONSTANTS, ACTION_TYPES, objUtils) {
    "use strict";

    const update = React.addons.update;
    const {
      ACTIVE_FOOTER,
      INFO_BOT_FIELDS,
      USER_INPUT_TYPES
    } = CHAT_VIEW_CONSTANTS;

    /**
     * Returns default user input config object to be set in store
     * @returns {Object} - input config object
     */
    const _getDefaultUserInputConfig = () => {
      return {
        value: "",
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

    const INITIAL_STATE = {
      userInput: _getDefaultUserInputConfig (),
      activeFooter: ACTIVE_FOOTER.REPLY,
      activeIssueMsgCursor: null,
      systemTyping: false,
      agentTyping: false,
      endUserFirstMsgId: "",
      unreadCount: 0,
      infoBot: {
        fieldsRequired: ["name", "email"],
        currentField: "",
        data: {
          [INFO_BOT_FIELDS.NAME]: {
            title: "Your Name",
            msg: "What's your name?",
            placeholder: "Enter your name",
            value: {
              value: "",
              errorMsg: "",
              validations: ["required"]
            },
            prefilled: false
          },
          [INFO_BOT_FIELDS.EMAIL]: {
            title: "Your Email Address",
            msg: "What's your email?",
            placeholder: "Enter your email",
            value: {
              value: "",
              errorMsg: "",
              validations: ["required", "email"]
            },
            prefilled: false
          }
        }
      },
      conversationId: "",
      readFaqList: []
    };

    return (state = INITIAL_STATE, action) => {
      let userInputUpdateObj = {};
      switch (action.type) {
        case ACTION_TYPES.REHYDRATE:
          const updateObj = {};
          if (action.data.infoBotCurrentField) {
            updateObj.infoBot = {
              currentField: {$set: action.data.infoBotCurrentField}
            };
          }
          if (action.data.replyText) {
            updateObj.userInput = {
              value: {$set: action.data.replyText}
            };
          }
          if (action.data.endUserFirstMsgId) {
            updateObj.endUserFirstMsgId = {$set: action.data.endUserFirstMsgId};
          }
          if (action.data.conversationId) {
            updateObj.conversationId = {$set: action.data.conversationId};
          }
          if (action.data.readFaqList) {
            updateObj.readFaqList = {$set: action.data.readFaqList};
          }
          return update (state, updateObj);

        case ACTION_TYPES.UPDATE_REPLY_TEXT:
          return update (state, {
            userInput: {
              value: {$set: action.value}
            }
          });

        case ACTION_TYPES.SET_ACTIVE_ISSUE_MSG_CURSOR:
          return update (state, {
            activeIssueMsgCursor: {$set: action.msgCursor}
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

        case ACTION_TYPES.SET_WM_CONFIG:
          return update (state, {
            infoBot: {
              fieldsRequired: {
                $set: action.config.user_info_bot.fields
              },
              currentField: {
                $set: action.config.user_info_bot.fields [0] || ""
              }
            }
          });

        case ACTION_TYPES.UPDATE_INFO_BOT_FIELD_VALUE:
          const {value, errorMsg} = action.value,
                valueUpdateObj = {};

          if (typeof value === "string") {
            valueUpdateObj.value = {$set: value};
          }

          if (typeof errorMsg === "string") {
            valueUpdateObj.errorMsg = {$set: errorMsg};
          }

          return update (state, {
            infoBot: {
              data: {
                [state.infoBot.currentField]: {
                  value: valueUpdateObj
                }
              }
            }
          });

        case ACTION_TYPES.CHANGE_INFO_BOT_CURRENT_FIELD:
          const {fieldsRequired, currentField} = state.infoBot;
          const currentFieldIndex = fieldsRequired.indexOf (currentField);
          const newCurrentField = fieldsRequired [currentFieldIndex + 1] || "";

          return update (state, {
            infoBot: {
              currentField: {$set: newCurrentField}
            }
          });

        case ACTION_TYPES.SET_END_USER_FIRST_MESSAGE_ID:
          return update (state, {
            endUserFirstMsgId: {$set: action.id}
          });

        case ACTION_TYPES.SET_CLIENT_CONFIG:
          // @TODO: Remove this during clean up. This will be unnecessary with chat bots.
          const {userName, userEmail} = action.config,
                infoBotChangeObj = {};
          if (typeof userName === "string" && userName) {
            infoBotChangeObj [INFO_BOT_FIELDS.NAME] = {
              value: {
                value: {$set: userName}
              },
              prefilled: {$set: true}
            };
          }

          if (typeof userEmail === "string" && userEmail) {
            infoBotChangeObj [INFO_BOT_FIELDS.EMAIL] = {
              value: {
                value: {$set: userEmail}
              },
              prefilled: {$set: true}
            };
          }

          return update (state, {
            infoBot: {
              data: infoBotChangeObj
            }
          });

        case ACTION_TYPES.SET_CONVERSATION_ID:
          return update (state, {
            conversationId: {$set: action.cid}
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

        case ACTION_TYPES.RESET:
          return INITIAL_STATE;

        default:
          return state;
      }
    };
  }
);
