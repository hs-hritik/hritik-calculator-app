/**
 * Chat view reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define("reducers/chatView", [
  "constants/appState",
  "constants/chatView",
  "constants/actionTypes",
  "constants/message",
  "gunpowder/constants/widgets/dragIt",
  "gunpowder/utils/object",
  "gunpowder/utils/array",
  "helpers/intent"
], function(
  APP_STATE_CONSTANTS,
  CHAT_VIEW_CONSTANTS,
  ACTION_TYPES,
  msgConstants,
  dragItConstants,
  objUtils,
  arrayUtils,
  intentHelpers
) {
  "use strict";

  const {NAVIGATION_STATES} = dragItConstants;
  const update = React.addons.update;

  const {ISSUE_TYPE} = APP_STATE_CONSTANTS;
  const {
    ACTIVE_FOOTER,
    USER_INPUT_TYPES,
    CURSOR_TYPES,
    DEFAULT_LIST_PICKER_NAVIGATION_STATE,
    INTENTS_MINIMUM_CHAR_FOR_SEARCH,
    INTENTS_SEARCH_ALGO,
    POLLING_STRATEGY_TYPES,
    AGRESSIVE_POLLING_TIMEOUT,
    CONSERVATIVE_POLLING_INTERVAL
  } = CHAT_VIEW_CONSTANTS;

  const {TYPE: MESSAGE_TYPE} = msgConstants;

  const INITIAL_ERROR_STATE = {
    type: "",
    title: "",
    subtitle: "",
    cta: ""
  };

  const INITIAL_MESSAGE_CURSOR = {
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
        navigationState: DEFAULT_LIST_PICKER_NAVIGATION_STATE
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
    const msgIdsAdded = existingMessageList.map((msg) => msg.id);
    const msgsToAdd = newMessageList.filter((msg) => {
      return msgIdsAdded.indexOf(msg.id) === -1;
    });

    return msgsToAdd;
  };

  /**
   * Return a list of messages where existing messages are replaced with redacted messages
   * When a message is redacted, we get real time update of it in poller.
   * If a message is redacted and if it's already present in the message list
   * then that message is replaced with a message having "message deleted" text.
   * @param {Array} existingMessageList - Existing list of messages
   * @param {Array} newMessageList - message list to search for redacted messages
   * @returns {Array} updated list of existing messages
   */
  const _replaceRedactedMessages = (existingMessageList, newMessageList) => {
    const redactedMessages = newMessageList.filter((msg) => msg.redacted);
    const redactedMessagesIds = redactedMessages.map((msg) => msg.id);

    return existingMessageList.map((msg) => {
      const redactedMsgIndex = redactedMessagesIds.indexOf(msg.id);

      if (redactedMsgIndex === -1) {
        return msg;
      }

      return redactedMessages[redactedMsgIndex];
    });
  };

  /**
   * Predicate to return whether user input type is default input
   * @param {Object} state - current state
   * @returns {Boolean} - whether current input type is default input
   */
  const isInputTypeDefault = (state) => {
    return state.userInput.type === USER_INPUT_TYPES.DEFAULT_INPUT;
  };

  /**
   * Process intents tree.
   * We convert the nested intent tree into the intents detail map.
   * @param {Array} tree - Intents tree array which we get from the backend.
   * @param {String} [parentId] - Parent intent id of the given intent tree (if any)
   * @returns {Object} - Intents details map and ids.
   */
  const _processIntentsTree = (tree, parentId = null) => {
    const intentsMap = {};
    const ids = [];

    tree.forEach((intent) => {
      const {id, children} = intent;
      let childrenIntents;

      if (children && children.length) {
        childrenIntents = _processIntentsTree(children, id);
      }

      intentsMap[id] = {
        id,
        label: intent.label,
        parentId,
        showByDefault: intent.show_by_default
      };

      if (childrenIntents) {
        intentsMap[id].children = childrenIntents.ids;
        objUtils.shallowMerge(intentsMap, childrenIntents.intentsMap);
      }

      ids.push(id);
    });

    return {intentsMap, ids};
  };

  /**
   * Returns the default data for intent tree.
   * @returns {Object} - default data for intent tree
   */
  const _getDefaultIntentsTreeData = () => {
    return {
      id: "",
      version: 0,
      updatedAt: 0,
      lastFetchTime: 0,
      intentsMap: {},
      topLevelIntentsOrder: []
    };
  };

  const INITIAL_STATE = {
    userInput: _getDefaultUserInputConfig(),
    activeFooter: ACTIVE_FOOTER.REPLY,
    activeIssueMsgCursor: null,
    systemTyping: false,
    agentTyping: false,
    unreadIssues: {},
    unreadMessageIds: [],
    markMessageAsSeenXhrIsInProgress: false,
    loadingMoreMsgsHasFailed: false,
    botState: {
      botStepInProgress: false,
      botStepMessage: null
    },
    messageList: [],
    messageCursor: INITIAL_MESSAGE_CURSOR,
    intents: {
      enforceIntentSelection: false,
      tree: _getDefaultIntentsTreeData(),
      model: null,
      pickerNavigationState: DEFAULT_LIST_PICKER_NAVIGATION_STATE,
      selectedIntentIds: [],
      isSearching: false,
      searchAlgo: "", // The algorithm used for searching (substring or ML)
      searchLevel: 0, // searchLevel 0 represents "no search", 1 represents search on level 1
      // intents and so on.
      searchResultIntents: [] // Array of {intentId: "", probability: 0.3} (probability would
      // be  null for substring search)
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
    loading: false,
    // This represents the error in the whole chat view
    // @TODO: Move the error handling to the error reducer.
    error: INITIAL_ERROR_STATE,
    localGreetingMessageId: "",
    // It contains key-value pair of avatarId and last updated timestamp
    avatarLastUpdatedTs: {},
    pollingStrategy: POLLING_STRATEGY_TYPES.CONSERVATIVE,
    pollingInterval: CONSERVATIVE_POLLING_INTERVAL.MINIMUM,
    liteSdkOs: ""
  };

  /**
   * Returns the index of message for given message id
   * @param {Array} list - list of messages
   * @param {String} id - message id
   * @returns {Number} - index of matched message
   */
  const _getMessageIndex = (list, id) => {
    return arrayUtils.findIndexByKey(list, id, "id");
  };

  return (state = INITIAL_STATE, action) => {
    let index = null;

    switch (action.type) {
      case ACTION_TYPES.REHYDRATE: {
        const updateObj = {};

        if (action.data.readFaqList) {
          updateObj.readFaqList = {$set: action.data.readFaqList};
        }
        return update(state, updateObj);
      }

      case ACTION_TYPES.NEW_CONVERSATION_STARTED: {
        const {conversationHistoryIsEnabled} = action;
        const userInputUpdateObj = _getDefaultUserInputConfig();

        const updateObj = {
          activeFooter: {$set: ACTIVE_FOOTER.REPLY},
          userInput: {$merge: userInputUpdateObj},
          pollerFailureCount: {$set: 0},
          isCsatSubmitted: {$set: false}
        };

        if (!conversationHistoryIsEnabled) {
          updateObj.messageList = {$set: []};
          updateObj.unreadIssues = {$set: {}};
          updateObj.unreadMessageIds = {$set: []};
          updateObj.messageCursor = {$set: INITIAL_MESSAGE_CURSOR};
          updateObj.issueCursor = {$set: 0};
          updateObj.activeIssueMsgCursor = {$set: null};
        }

        return update(state, updateObj);
      }

      case ACTION_TYPES.CREATE_PREISSUE_REQUEST:
        // On create preissue request
        // Disable the user input
        // Show fake typing indicator (represents loading state)
        return update(state, {
          userInput: {
            disabled: {$set: true}
          },
          systemTyping: {$set: true}
        });

      case ACTION_TYPES.CREATE_PREISSUE_SUCCESS: {
        // User input should be disabled for preissues.
        const userInputShouldBeDisabled = action.issueDetails.issueType === ISSUE_TYPE.PRE_ISSUE;
        // If the current input type is the default one, reset the value.
        const defaultInputValue = isInputTypeDefault(state)
          ? ""
          : state.userInput.defaultInputValue;

        // When an issue is created, reset userInput, selected intents data and chat view error
        return update(state, {
          userInput: {
            value: {$set: ""},
            // Save user entered text for input type default input
            defaultInputValue: {$set: defaultInputValue},
            disabled: {$set: userInputShouldBeDisabled},
            errorMsg: {$set: ""}
          },
          intents: {
            pickerNavigationState: {$set: DEFAULT_LIST_PICKER_NAVIGATION_STATE},
            selectedIntentIds: {$set: []},
            isSearching: {$set: false},
            searchAlgo: {$set: ""},
            searchResultIntents: {$set: []}
            // We are not resetting tree and model because we fetch the new tree/model
            // when we start the new conversation only if it has passed the tree/model SLA.
            // Also, there is no user selected data in tree/model.
            // @TODO: Intents: Confirm from product if they want us to fetch the tree
            // for new issue even if the SLA hasn't passed yet. If yes, reset tree/model
            // data as well.
          },
          systemTyping: {$set: false},
          error: {$set: INITIAL_ERROR_STATE}
        });
      }

      case ACTION_TYPES.CREATE_PREISSUE_FAILURE:
        const {error} = action;
        // On create preissue request failure
        // Enable the user input
        // Hide fake typing indicator (represents loading state)
        // Set the error the state
        // Hide the loading screen
        return update(state, {
          userInput: {
            disabled: {$set: false}
          },
          systemTyping: {$set: false},
          error: {$set: error},
          loading: {$set: false}
        });

      case ACTION_TYPES.USER_REPLY_REQUEST: {
        const {issueType, botStepInProgress} = action;
        const isIssue = issueType === ISSUE_TYPE.ISSUE;
        const isPreIssue = issueType === ISSUE_TYPE.PRE_ISSUE;
        // Show fake typing indicator for preissues and issues with an ongoing bot
        const systemTypingShouldRender = isPreIssue || (isIssue && botStepInProgress);

        return update(state, {
          userInput: {
            disabled: {$set: true}
          },
          systemTyping: {$set: systemTypingShouldRender}
        });
      }

      case ACTION_TYPES.USER_REPLY_SUCCESS: {
        const {messages, issueType, botStepInProgress, messageType} = action;

        // Get the message list to be appended to the state
        const updatedExistingMessages = _replaceRedactedMessages(state.messageList, messages);
        const uniqueNewMessages = _getUniqueMessages(state.messageList, messages);
        const newMessageList = updatedExistingMessages.concat(uniqueNewMessages);

        // Enable user reply for an issue with a non-bot conversation
        const userInputShouldBeEnabled = issueType === ISSUE_TYPE.ISSUE && !botStepInProgress;
        // If the current input type is the default one, reset the value.
        const defaultInputValue = isInputTypeDefault(state)
          ? ""
          : state.userInput.defaultInputValue;

        const updateObj = {
          userInput: {
            disabled: {$set: !userInputShouldBeEnabled},
            value: {$set: ""},
            defaultInputValue: {$set: defaultInputValue},
            errorMsg: {$set: ""}
          },
          messageList: {$set: newMessageList}
        };

        if (messageType === MESSAGE_TYPE.RESP_FAQ_LIST_WITH_OPTION_INPUT) {
          updateObj.readFaqList = {$set: []};
        }

        return update(state, updateObj);
      }

      case ACTION_TYPES.USER_REPLY_FAILURE:
        // In case of a failure, enable the reply box and hide the fake typing indicator.
        // This will let the user retry sending the message.
        return update(state, {
          userInput: {
            disabled: {$set: false}
          },
          systemTyping: {$set: false}
        });

      case ACTION_TYPES.SEARCH_INTENTS: {
        const {searchText} = action;
        const {
          intents: {
            tree: {intentsMap},
            model,
            tokenDelimiters
          }
        } = state;

        const intentsChangeObj = {
          pickerNavigationState: {$set: NAVIGATION_STATES.OPENED}
        };

        // If the number of search characters is less than minimum characters required for
        // search, reset the search results
        if (searchText.trim().length < INTENTS_MINIMUM_CHAR_FOR_SEARCH) {
          intentsChangeObj.isSearching = {$set: false};
          intentsChangeObj.searchResultIntents = {$set: []};
        } else if (!model) {
          // If the model is not yet loaded, do the string based search.
          const res = intentHelpers.substringSearch(intentsMap, searchText);
          intentsChangeObj.isSearching = {$set: true};
          intentsChangeObj.searchResultIntents = {$set: res.searchResults};
          intentsChangeObj.searchLevel = {$set: res.searchLevel};
          intentsChangeObj.searchAlgo = {$set: INTENTS_SEARCH_ALGO.SUBSTRING};
        } else {
          const res = intentHelpers.modelSearch({
            model,
            intentsMap,
            query: searchText,
            tokenDelimiters
          });
          intentsChangeObj.isSearching = {$set: true};
          intentsChangeObj.searchResultIntents = {$set: res.searchResults};
          intentsChangeObj.searchLevel = {$set: res.searchLevel};
          intentsChangeObj.searchAlgo = {$set: INTENTS_SEARCH_ALGO.ML};
        }

        return update(state, {
          intents: intentsChangeObj
        });
      }

      case ACTION_TYPES.UPDATE_REPLY_TEXT:
        return update(state, {
          userInput: {
            value: {$set: action.value},
            // Save user entered text for input type default input
            defaultInputValue: {
              $set: isInputTypeDefault(state) ? action.value : state.userInput.defaultInputValue
            },
            errorMsg: {$set: ""}
          }
        });

      case ACTION_TYPES.SET_ACTIVE_ISSUE_MSG_CURSOR: {
        const {cursorTs, issueType, issueId, preIssueId, cursorType} = action.msgCursor;

        return update(state, {
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
      }

      case ACTION_TYPES.SET_CHAT_VIEW_FOOTER: {
        let userInputUpdateObj = {};
        if (action.footer === ACTIVE_FOOTER.REPLY && state.activeFooter !== ACTIVE_FOOTER.REPLY) {
          userInputUpdateObj = _getDefaultUserInputConfig();
        }

        return update(state, {
          activeFooter: {$set: action.footer},
          userInput: {$merge: userInputUpdateObj}
        });
      }

      case ACTION_TYPES.DISABLE_REPLY_BOX:
        return update(state, {
          userInput: {
            disabled: {$set: true}
          }
        });

      case ACTION_TYPES.ENABLE_REPLY_BOX:
        return update(state, {
          userInput: {
            disabled: {$set: false}
          }
        });

      case ACTION_TYPES.SET_LATEST_CONVERSATION_HAS_LOADED:
        return update(state, {
          latestConversationHasLoaded: {$set: true}
        });

      case ACTION_TYPES.TOGGLE_SYSTEM_TYPING:
        return update(state, {
          systemTyping: {$set: action.typing}
        });

      case ACTION_TYPES.TOGGLE_CONVERSATIONS_LOADER:
        return update(state, {
          pastConversationsLoading: {$set: action.loading}
        });

      case ACTION_TYPES.TOGGLE_AGENT_TYPING:
        return update(state, {
          agentTyping: {$set: action.typing}
        });

      case ACTION_TYPES.UPDATE_UNREAD_MESSAGES_DATA:
        return update(state, {
          unreadIssues: {$merge: action.issues},
          unreadMessageIds: {$push: action.messageIds}
        });

      case ACTION_TYPES.PAGE_VISIBILITY_CHANGE:
        const {parentPageIsVisible, pollingStrategy, widgetIsMinimized} = action.data;

        if (
          (widgetIsMinimized || !parentPageIsVisible) &&
          pollingStrategy !== POLLING_STRATEGY_TYPES.CONSERVATIVE
        ) {
          return update(state, {
            pollingStrategy: {$set: POLLING_STRATEGY_TYPES.CONSERVATIVE},
            pollingInterval: {$set: 0}
          });
        } else if (
          parentPageIsVisible &&
          !widgetIsMinimized &&
          pollingStrategy !== POLLING_STRATEGY_TYPES.AGGRESSIVE
        ) {
          return update(state, {
            pollingStrategy: {$set: POLLING_STRATEGY_TYPES.AGGRESSIVE},
            pollingInterval: {$set: AGRESSIVE_POLLING_TIMEOUT}
          });
        }

        return update(state, {
          pollingStrategy: {$set: state.pollingStrategy},
          pollingInterval: {$set: state.pollingInterval}
        });

      case ACTION_TYPES.UPDATE_POLLING_DATA:
        return update(state, {
          pollingStrategy: {$set: action.pollingStrategy},
          pollingInterval: {$set: action.pollingInterval}
        });

      case ACTION_TYPES.MARK_MESSAGES_SEEN_XHR_REQUEST:
        return update(state, {
          markMessageAsSeenXhrIsInProgress: {$set: true}
        });

      case ACTION_TYPES.MARK_MESSAGES_SEEN_XHR_SUCCESS:
        return update(state, {
          unreadIssues: {$set: {}},
          unreadMessageIds: {$set: []}
        });

      case ACTION_TYPES.MARK_MESSAGES_SEEN_XHR_END:
        return update(state, {
          markMessageAsSeenXhrIsInProgress: {$set: false}
        });

      case ACTION_TYPES.UPDATE_READ_FAQ_LIST:
        return update(state, {
          readFaqList: {$push: [action.faqId]}
        });

      case ACTION_TYPES.SET_ALL_MESSAGES_ARE_LOADED:
        return update(state, {
          allMessagesAreLoaded: {$set: action.msgsLoaded}
        });

      case ACTION_TYPES.SET_LOADING_MORE_MSGS_FAILED:
        return update(state, {
          loadingMoreMsgsHasFailed: {$set: action.loadingMoreMsgsHasFailed}
        });

      case ACTION_TYPES.SET_USER_IS_REDACTED:
        return update(state, {
          userIsRedacted: {$set: action.userIsRedacted}
        });

      case ACTION_TYPES.RESET_USER_INPUT_DATA: {
        const userInputUpdateObj = objUtils.shallowMerge(_getDefaultUserInputConfig(), {
          // Restore default input value when user input is reset
          value: state.userInput.defaultInputValue
        });
        return update(state, {
          userInput: {$set: userInputUpdateObj}
        });
      }

      case ACTION_TYPES.UPDATE_USER_INPUT_DATA:
        return update(state, {
          userInput: {$merge: action.input}
        });

      case ACTION_TYPES.SET_USER_SELECTED_OPTION:
        return update(state, {
          userInput: {
            selectedOption: {$set: action.option}
          }
        });

      case ACTION_TYPES.UPDATE_LIST_PICKER_NAVIGATION_STATE:
        return update(state, {
          userInput: {
            listPicker: {
              navigationState: {$set: action.navigationState}
            }
          }
        });

      case ACTION_TYPES.UPDATE_INTENTS_NAVIGATION_STATE:
        return update(state, {
          intents: {
            pickerNavigationState: {$set: action.navigationState}
          }
        });

      case ACTION_TYPES.SET_USER_VIEWING_PAST_MESSAGES:
        return update(state, {
          userIsViewingPastMessages: {$set: action.isViewing}
        });

      case ACTION_TYPES.APPEND_MESSAGES: {
        /**
         * When message is redacted, we get real time update of it in poller.
         * If message is redacted and if its id is already present in the message list
         * then that message is replaced with a message having "message deleted" text.
         */
        const updatedExistingMessages = _replaceRedactedMessages(
          state.messageList,
          action.messages
        );
        const uniqueNewMessages = _getUniqueMessages(state.messageList, action.messages);
        const messages = updatedExistingMessages.concat(uniqueNewMessages);

        const updateObj = {
          messageList: {$set: messages}
        };

        if (action.responseType === MESSAGE_TYPE.RESP_FAQ_LIST_WITH_OPTION_INPUT) {
          updateObj.readFaqList = {$set: []};
        }

        return update(state, updateObj);
      }

      case ACTION_TYPES.UPDATE_AVATAR_LAST_UPDATED_TS:
        return update(state, {
          avatarLastUpdatedTs: {$set: {...state.avatarLastUpdatedTs, ...action.avatarsTs}}
        });

      case ACTION_TYPES.PREPEND_MESSAGES:
        const uniqMessages = _getUniqueMessages(state.messageList, action.messages);
        const newMessageList = uniqMessages.concat(state.messageList);

        return update(state, {
          messageList: {$set: newMessageList}
        });

      case ACTION_TYPES.REMOVE_MESSAGE:
        index = _getMessageIndex(state.messageList, action.messageId);
        if (index > -1) {
          return update(state, {
            messageList: {$splice: [[index, 1]]}
          });
        }
        return state;

      case ACTION_TYPES.SET_ATTACHMENT_ERROR:
        index = _getMessageIndex(state.messageList, action.messageId);
        return update(state, {
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
        return update(state, {
          issueCursor: {$set: action.cursor}
        });

      case ACTION_TYPES.SET_CSAT_SUBMITTED:
        return update(state, {
          isCsatSubmitted: {$set: action.submitted}
        });

      case ACTION_TYPES.SET_POLLER_FAILURE_COUNT:
        return update(state, {
          pollerFailureCount: {$set: action.count}
        });

      case ACTION_TYPES.TOGGLE_CHAT_VIEW_LOADING:
        return update(state, {
          loading: {$set: action.loading}
        });

      case ACTION_TYPES.SET_CHAT_VIEW_ERROR:
        return update(state, {
          error: {$set: action.error}
        });

      case ACTION_TYPES.SET_BOT_STEP_IN_PROGRESS:
        return update(state, {
          botState: {
            botStepInProgress: {$set: action.inProgress}
          }
        });

      case ACTION_TYPES.SAVE_BOT_STEP_MESSAGE:
        return update(state, {
          botState: {
            botStepMessage: {$set: action.message}
          }
        });

      case ACTION_TYPES.INTENTS_TREE_REQUEST:
        return update(state, {
          loading: {$set: true}
        });

      case ACTION_TYPES.INTENTS_TREE_SUCCESS: {
        const {response, fetchTime} = action;
        const {intentsMap, ids} = _processIntentsTree(response.tree);

        return update(state, {
          loading: {$set: false},
          intents: {
            enforceIntentSelection: {$set: response.eis},
            tokenDelimiters: {$set: response.token_delimiters},
            tree: {
              id: {$set: response.id},
              version: {$set: response.version},
              updatedAt: {$set: response.updated_at},
              lastFetchTime: {$set: fetchTime},
              intentsMap: {$set: intentsMap},
              topLevelIntentsOrder: {$set: ids}
            }
          }
        });
      }

      case ACTION_TYPES.INTENTS_TREE_FAILURE:
        return update(state, {
          loading: {$set: false},
          // @TODO: Intents: Confirm enforceIntentSelection flag behavior in case of failure.
          intents: {
            tree: {$set: _getDefaultIntentsTreeData()}
          }
        });

      case ACTION_TYPES.INTENTS_MODEL_SUCCESS: {
        const {response} = action;

        return update(state, {
          intents: {
            model: {
              $set: {
                version: response.version,
                intentIds: response.intent_ids,
                vocabulary: response.vocabulary,
                weights: {
                  wordIntentProbabilities: response.weights.word_label_probabilities,
                  intentsBaseProbabilities: response.weights.label_base_probabilities
                },
                parameters: {
                  confidenceThreshold: response.parameters.confidence_threshold,
                  maxCombinedConfidence: response.parameters.max_combined_confidence
                }
              }
            }
          }
        });
      }

      case ACTION_TYPES.INTENT_SELECTED: {
        let selectedIntentIdsChangeObj;
        const {
          tree: {intentsMap},
          isSearching
        } = state.intents;

        const selectedIntentId = action.intent.id;
        // If the user isn't searching, simply push the selected intent to selectedIntentIds
        if (!isSearching) {
          selectedIntentIdsChangeObj = {$push: [selectedIntentId]};
        } else {
          // If the user selects an intent from search result, create the array
          // of the selected intent ids, since we only show the leaf node intents
          // in the search results.
          let intent = intentsMap[selectedIntentId];
          const selectedIntentIds = [];

          while (intent.parentId) {
            selectedIntentIds.push(intent.id);
            intent = intentsMap[intent.parentId];
          }

          selectedIntentIds.push(intent.id);
          selectedIntentIdsChangeObj = {$set: selectedIntentIds.reverse()};
        }

        return update(state, {
          intents: {
            selectedIntentIds: selectedIntentIdsChangeObj,
            pickerNavigationState: {$set: NAVIGATION_STATES.OPENED}
          }
        });
      }

      case ACTION_TYPES.STOP_INTENTS_SEARCH: {
        return update(state, {
          intents: {
            isSearching: {$set: false},
            searchResultIntents: {$set: []},
            searchAlgo: {$set: ""}
          }
        });
      }

      case ACTION_TYPES.INTENT_UNSELECTED: {
        return update(state, {
          intents: {
            selectedIntentIds: {
              $splice: [[state.intents.selectedIntentIds.length - 1, 1]]
            }
          }
        });
      }

      case ACTION_TYPES.BOT_START:
        // When a bot start message is received, disable the reply box and show the TAI, while
        // waiting for the next bot step.
        return update(state, {
          userInput: {
            disabled: {$set: true}
          },
          systemTyping: {$set: true}
        });

      case ACTION_TYPES.BOT_END: {
        // When a bot end message is received:
        // reset the current user input data
        // if the next message is going to a bot step, disable the reply box and show TAI
        // if the next message is not going to a bot step, enable the reply box and hide TAI
        const {nextMessageIsBotStep} = action;
        const userInputUpdateObj = objUtils.shallowMerge(_getDefaultUserInputConfig(), {
          value: state.userInput.defaultInputValue, // Restore value of the default input
          disabled: !!nextMessageIsBotStep
        });

        return update(state, {
          userInput: {$set: userInputUpdateObj},
          systemTyping: {$set: !!nextMessageIsBotStep}
        });
      }

      case ACTION_TYPES.BOT_MESSAGE_WITH_NO_USER_INPUT: {
        // If a bot message does not require a user input, AND:
        // if the issue type is issue
        //   - reset user input to default.
        //   - enable the user input
        //   - hide TAI
        // if the issue type is preIssue, hide footer and show TAI
        const {issueType} = action;

        if (issueType === ISSUE_TYPE.ISSUE) {
          const userInputUpdateObj = objUtils.shallowMerge(_getDefaultUserInputConfig(), {
            value: state.userInput.defaultInputValue, // Restore value of the default input
            disabled: false
          });

          const updateObj = {
            userInput: {$set: userInputUpdateObj},
            systemTyping: {$set: false}
          };

          return update(state, updateObj);
        }

        // For preissues
        return update(state, {
          userInput: {
            disabled: {$set: true}
          },
          systemTyping: {$set: true}
        });
      }

      case ACTION_TYPES.BOT_MESSAGE_WITH_USER_INPUT: {
        // When a bot message with a user input is received
        // - set action's processed user input to the state
        // - set active footer to reply
        // - take a backup of the value of the default input, to be used when the bot input switches
        //    back to the deafult input
        // - enable the user input
        // - hide TAI
        const {userInput} = action;
        const userInputUpdateObj = objUtils.shallowMerge(_getDefaultUserInputConfig(), userInput);

        userInputUpdateObj.defaultInputValue = state.userInput.defaultInputValue;
        userInputUpdateObj.disabled = false;

        return update(state, {
          userInput: {$set: userInputUpdateObj},
          activeFooter: {$set: ACTIVE_FOOTER.REPLY},
          systemTyping: {$set: false}
        });
      }

      case ACTION_TYPES.SET_LOCAL_GREETING_MESSAGE_ID:
        return update(state, {
          localGreetingMessageId: {$set: action.id}
        });

      case ACTION_TYPES.CLEAR_CHAT_VIEW_ERRORS:
        return update(state, {
          error: {$set: INITIAL_ERROR_STATE}
        });

      case ACTION_TYPES.RESET:
        return INITIAL_STATE;

      case ACTION_TYPES.SET_LITE_SDK_CONFIG:
        return update(state, {
          liteSdkOs: {$set: action.data.os}
        });

      default:
        return state;
    }
  };
});
