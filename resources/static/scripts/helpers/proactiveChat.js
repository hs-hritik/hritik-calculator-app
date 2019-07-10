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
    "actions/postSdkMessage",
    "helpers/localStorage"
  ],
  function (proactiveChatConstants, store, actionCreators, postSdkMessage, lsHelpers) {
    "use strict";

    const {CONDITION, OPERATOR, ACTION, TIME_RELATION} = proactiveChatConstants;

    let _ruleExecuted = false;

    /**
     * Return true if the a rule's conditions satisfy
     * @param {Object} rule - The rule object with conditions
     * @returns {boolean}
     */
    const _areConditionsValid = (rule) => {
      const {conditions} = rule;
      const {
        appState: {
          parentPageInfo: {
            url: parentPageUrl
          },
          tags: pageTags
        }
      } = store.getState ();

      return conditions.every ((condition) => {
        let valid = true;

        if (condition.type === CONDITION.PAGE_URL) {
          const conditionPageUrl = condition.value;
          const pageUrl = parentPageUrl;

          switch (condition.operator) {
            case OPERATOR.EQUALS:
              if (pageUrl !== conditionPageUrl) {
                valid = false;
              }
              break;
            case OPERATOR.CONTAINS:
              if (pageUrl.indexOf (conditionPageUrl) === -1) {
                valid = false;
              }
              break;
            case OPERATOR.STARTS_WITH:
              if (pageUrl.indexOf (conditionPageUrl) !== 0) {
                valid = false;
              }
              break;
          }
        } else if (condition.type === CONDITION.TAG) {
          const conditionTags = condition.value;

          switch (condition.operator) {
            case OPERATOR.EQUALS:
              // All the tags passed with the page should exactly match the ones
              // passed in the condition
              let tagsAreEqual = true;
              if (conditionTags.length !== pageTags.length) {
                tagsAreEqual = false;
              } else {
                tagsAreEqual = conditionTags.every ((tag) => pageTags.indexOf (tag) !== -1);
              }

              if (!tagsAreEqual) {
                valid = false;
              }
              break;
            case OPERATOR.NOT_EQUALS:
            case OPERATOR.DOES_NOT_CONTAIN:
              // None of the condition tags should be present in the page tags list
              const tagsMatch = conditionTags.some (
                (tag) => pageTags.indexOf (tag) !== -1
              );

              if (tagsMatch) {
                valid = false;
              }
              break;
            case OPERATOR.CONTAINS:
              // Page tags should `contain` all the condition tags
              const pageTagsContainConditionTags = conditionTags.every (
                (tag) => pageTags.indexOf (tag) !== -1
              );

              if (!pageTagsContainConditionTags) {
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
        store.dispatch (postSdkMessage.toggleMessenger (false));
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
      const {appState, businessHoursViewState} = store.getState ();

      const outOfBusinessHours = businessHoursViewState.businessHoursEnabled &&
        !businessHoursViewState.inBusinessHours;
      const ruleExecutedOnSite = rule.onceOnSite && lsHelpers.getProactiveChatHasTriggered ();

      // Execute the proactive chat rule only if
      // the conversation hasn't started already
      // no proactive chat rule has been executed already
      // if rule is configured to be executed once per site, it hasn't executed at all
      // it's business hours if business hours in enabled
      // all the conditions for the rule satisfy
      if (
        !appState.conversationStarted &&
        !_ruleExecuted &&
        !ruleExecutedOnSite &&
        !outOfBusinessHours &&
        _areConditionsValid (rule)
      ) {
        _applyActions (rule);
        _ruleExecuted = true;

        if (rule.onceOnSite) {
          lsHelpers.setProactiveChatHasTriggered (true);
        }
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
            case CONDITION.TIME_RELATION:
              rule.timeRelationOperator = condition.operator;
              break;
          }
        });

        // The rule can be configured to be executed only once per site.
        rule.onceOnSite = rule.meta && rule.meta.trigger_once_on_site;

        return rule;
      });
    };

    /**
     * Add proactive chat actions to the runtime's message queue
     * @param {Object} rule - The rule object
     */
    const enqueue = (rule) => {
      // Enqueue the proactive chat rules
      const timeOnPage = rule.timeOnPage;
      const timeOnSite = rule.timeOnSite;
      const timeRelation = rule.timeRelationOperator;

      const siteActivityStartTime = lsHelpers.getSiteActivityStartTime ();
      const siteActivityStartedAgo = Date.now () - siteActivityStartTime;

      const effectiveTimeOnSite = timeOnSite - siteActivityStartedAgo;

      // If there's an AND relation b/w time on page and time on site,
      // execute the rules after both the times have elapsed i.e. set time out
      // with the greater of the two values.
      if (timeRelation === TIME_RELATION.AND) {
        setTimeout (() => {
          _executeRule (rule);
        }, Math.max (timeOnPage, effectiveTimeOnSite));
      } else if (timeRelation === TIME_RELATION.OR) {
        // If the user has spent more time than the `time on site` rule, the
        // `effective time on site` would turn out to be negative. If so,
        // execute the proactive chat rule immediately.
        if (effectiveTimeOnSite <= 0) {
          _executeRule (rule);
        } else {
          // Else set time out with the smaller of the two values.
          setTimeout (() => {
            _executeRule (rule);
          }, Math.min (timeOnPage, effectiveTimeOnSite));
        }
      }
    };

    return {
      getProcessedRules,
      enqueue
    };
  });
