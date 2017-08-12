/**
 * Chat view reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/chatView",
  [
    "constants/chatView",
    "constants/actionTypes"
  ],
  function (CHAT_VIEW_CONSTANTS, ACTION_TYPES) {
    "use strict";

    const update = React.addons.update,
          {ACTIVE_FOOTER} = CHAT_VIEW_CONSTANTS;

    const INITIAL_STATE = {
      replyBox: {
        value: "",
        disabled: false
      },
      activeFooter: ACTIVE_FOOTER.REPLY,
      activeIssueMsgCursor: null,
      csatRating: 0,
      systemTyping: false,
      agentTyping: false,
      endUserFirstMsg: null,
      unreadCount: 0,
      infoBot: {
        fieldsRequired: ["name", "email"],
        currentField: "",
        data: {
          name: {
            title: "Your Name",
            msg: "What's your name?",
            value: {
              value: "",
              errorMsg: "",
              validations: ["required"]
            }
          },
          email: {
            title: "Your Email Address",
            msg: "What's your email?",
            value: {
              value: "",
              errorMsg: "",
              validations: ["required", "email"]
            }
          }
        }
      }
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        case ACTION_TYPES.REHYDRATE:
          const updateObj = {};
          if (action.data.infoBotCurrentField) {
            updateObj.infoBot = {
              currentField: {$set: action.data.infoBotCurrentField}
            };
          }
          return update (state, updateObj);

        case ACTION_TYPES.UPDATE_REPLY_TEXT:
          return update (state, {
            replyBox: {
              value: {$set: action.value}
            }
          });

        case ACTION_TYPES.SET_ACTIVE_ISSUE_MSG_CURSOR:
          return update (state, {
            activeIssueMsgCursor: {$set: action.msgCursor}
          });

        case ACTION_TYPES.SET_CHAT_VIEW_FOOTER:
          return update (state, {
            activeFooter: {$set: action.footer}
          });

        case ACTION_TYPES.UPDATE_CSAT_RATING:
          return update (state, {
            csatRating: {$set: action.rating}
          });

        case ACTION_TYPES.DISABLE_REPLY_BOX:
          return update (state, {
            replyBox: {
              disabled: {$set: true}
            }
          });

        case ACTION_TYPES.ENABLE_REPLY_BOX:
          return update (state, {
            replyBox: {
              disabled: {$set: false}
            }
          });

        case ACTION_TYPES.TOGGLE_SYSTEM_TYPING:
          return update (state, {
            systemTyping: {$set: action.typing}
          });

        case ACTION_TYPES.SET_UNREAD_COUNT:
          return update (state, {
            unreadCount: {$set: action.count}
          });

        case ACTION_TYPES.SET_WM_CONFIG:
          return update (state, {
            infoBot: {
              fieldsRequired: {
                $set: action.config.info_bot.selection
              },
              currentField: {
                $set: action.config.info_bot.selection [0]
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
          const newCurrentField = fieldsRequired [currentFieldIndex + 1] || null;

          return update (state, {
            infoBot: {
              currentField: {$set: newCurrentField}
            }
          });

        case ACTION_TYPES.SET_END_USER_FIRST_MESSAGE:
          return update (state, {
            endUserFirstMsg: {$set: action.msg}
          });

        default:
          return state;
      }
    };
  }
);
