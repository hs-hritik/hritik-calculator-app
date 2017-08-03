/**
 * Chat view reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/chatView",
  [
    "constants/chatView",
    "constants/actionTypes",
    "gunpowder/utils/schema"
  ],
  function (CHAT_VIEW_CONSTANTS, ACTION_TYPES, schema) {
    "use strict";

    const update = React.addons.update,
          {ACTIVE_FOOTER} = CHAT_VIEW_CONSTANTS,
          {Input} = schema;

    const INITIAL_STATE = {
      replyBox: {
        value: "",
        attachments: [],
        disabled: false
      },
      activeFooter: ACTIVE_FOOTER.REPLY,
      activeIssueMsgCursor: null,
      suggestedFaqs: [],
      csatRating: 0,
      systemTyping: false,
      agentTyping: false,
      unreadCount: 0,
      getInfoBot: {
        fieldsRequired: ["name", "email"],
        currentField: "",
        data: {
          name: {
            title: "Your Name",
            msg: "What's your name?",
            value: new Input ({
              value: "",
              validations: ["required"]
            })
          },
          email: {
            title: "Your Email Address",
            msg: "What's your email?",
            value: new Input ({
              value: "",
              validations: ["required", "email"]
            })
          }
        }
      }
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
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

        case ACTION_TYPES.SET_FAQ_SUGGESTIONS:
          return update (state, {
            suggestedFaqs: {$set: action.faqs}
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
            getInfoBot: {
              fieldsRequired: {
                $set: action.config.user_info_bot.selection
              },
              currentField: {
                $set: action.config.user_info_bot.selection [0]
              }
            }
          });

        case ACTION_TYPES.UPDATE_GET_INFO_FIELD_VALUE:
          return update (state, {
            getInfoBot: {
              data: {
                [state.getInfoBot.currentField]: {
                  value: {
                    value: {$set: action.value}
                  }
                }
              }
            }
          });

        case ACTION_TYPES.CHANGE_GET_INFO_CURRENT_FIELD:
          const {fieldsRequired, currentField} = state.getInfoBot;
          const currentFieldIndex = fieldsRequired.indexOf (currentField);
          const newCurrentField = fieldsRequired [currentFieldIndex + 1] || null;

          return update (state, {
            getInfoBot: {
              currentField: {$set: newCurrentField}
            }
          });

        default:
          return state;
      }
    };
  }
);
