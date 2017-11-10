/**
 * Helpers for proactive chat functionality.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 26 Oct, 2017
 */

define ("helpers/proactiveChat",
  [
    "constants/proactiveChat",
    "store",
    "actions/actionCreators",
    "extras/postSdkMessage",
    "helpers/localStorage"
  ],
  function (proactiveChatConstants, store, actionCreators, postSdkMessage, lsHelpers) {
    "use strict";

    const {CONDITION, OPERATOR, ACTION} = proactiveChatConstants;

    let _ruleExecuted = false;

    /**
     * Return true if the a rule's conditions satisfy
     * @param {Object} rule - The rule object with conditions
     * @returns {boolean}
     */
    const _areConditionsValid = (rule) => {
      const {conditions} = rule;

      return conditions.every ((condition) => {
        let valid = true;

        if (condition.type === CONDITION.PAGE_URL) {
          const conditionPageUrl = condition.value;
          const pageUrl = store.getState ().appState.parentPageInfo.url;

          // @TODO: More operators to follow.
          switch (condition.operator) {
            case OPERATOR.EQUALS:
              if (conditionPageUrl !== pageUrl) {
                valid = false;
              }
              break;
          }
        } else if (condition.type === CONDITION.TAG) {
          const conditionTags = condition.value;
          const pageTags = store.getState ().appState.tags;

          // @TODO: More operators to follow.
          switch (condition.operator) {
            case OPERATOR.EQUALS:
              const tagsAreValid = conditionTags.every ((tag) => {
                return pageTags.indexOf (tag) !== -1;
              });

              if (!tagsAreValid) {
                valid = false;
              }
              break;
          }
        }

        return valid;
      });
    };

    /**
     * Open the web chat widget if it's minimized
     */
    const _openWidget = () => {
      const {minimized} = store.getState ().appState;
      if (minimized) {
        postSdkMessage.toggleMessenger (false);
      }
    };

    /**
     * Apply proactive chat rule actions
     * @param {Object} rule - The rule object with actions
     */
    const _applyActions = (rule) => {
      const {actions} = rule;

      actions.forEach ((action) => {
        switch (action.type) {
          case ACTION.GREETING:
            if (action.operator === OPERATOR.SET) {
              store.dispatch (actionCreators.setGreetingMsg (action.value));
            }
            break;
          case ACTION.TAG:
            if (action.operator === OPERATOR.SET) {
              store.dispatch (actionCreators.setTags (action.value));
            }
            break;
          case ACTION.CIF:
            if (action.operator === OPERATOR.SET) {
              store.dispatch (actionCreators.setCif (action.value));
            }
            break;
          case ACTION.WIDGET:
            if (action.operator === OPERATOR.OPEN && action.value) {
              // Open the web chat widget
              _openWidget ();
            }
            break;
        }
      });
    };

    /**
     * Execute a proactive chat rule
     * @param {Object} rule - The rule object
     */
    const _executeRule = (rule) => {
      const {appState} = store.getState ();

      // Execute the rule if
      // the conversation hasn't started already
      // no proactive chat rule has been executed
      // all the conditions for the rule satisfy
      if (!appState.conversationStarted && !_ruleExecuted && _areConditionsValid (rule)) {
        _applyActions (rule);
        _ruleExecuted = true;
      }
    };

    /**
     * Return processed data object for the proactive chat rules list provided
     * by the JS API to set these rules.
     * @returns {Object} - processed proactive chat rules
     */
    const getProcessedRules = (rules) => {
      return rules.map ((rule) => {
        const {conditions} = rule;

        conditions.forEach ((condition) => {
          switch (condition.type) {
            case CONDITION.TIME_ON_PAGE:
              rule.timeOnPage = condition.value * 1000; // In milliseconds
              break;
            case CONDITION.TIME_ON_SITE:
              rule.timeOnSite = condition.value * 1000; // In milliseconds
              break;
            case CONDITION.TIME_LOGIC:
              rule.timeLogicOperator = condition.operator;
              break;
          }
        });

        return rule;
      });
    };

    /**
     * Add proactive chat actions to the runtime's message queue
     * @param {Object} rule - The rule object
     */
    const enqueue = (rule) => {
      // @TODO: Check for time logic (And/Or) and setTimeout accordingly
      const timeOnPage = rule.timeOnPage;
      const timeOnSite = rule.timeOnSite;

      const siteActivityStartTime = lsHelpers.getSiteActivityStartTime ();
      const siteActivityStartedAgo = Date.now () - siteActivityStartTime;

      const effectiveTimeOnSite = timeOnSite - siteActivityStartedAgo;

      // Add proactive chat rules execution to the message queue to be executed
      // after the `time on page` time elapses.
      setTimeout (() => {
        _executeRule (rule);
      }, timeOnPage);

      // If the user has spent more time than the `time on site` rule, the
      // `effective time on site` would turn out to be negative. If so,
      // execute the proactive chat rule immediately. Else, add it to the
      // message queue to be executed after the `effective time on site` elapses.
      if (effectiveTimeOnSite > 0) {
        setTimeout (() => {
          _executeRule (rule);
        }, effectiveTimeOnSite);
      } else {
        _executeRule (rule);
      }
    };

    return {
      getProcessedRules,
      enqueue
    };
  });
