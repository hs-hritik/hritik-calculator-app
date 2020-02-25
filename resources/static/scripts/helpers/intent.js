/**
 * Smart intents related helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created Dec 27, 2019
 */

define("helpers/intent", [
  "helpers/intentModelSearch",
  "gunpowder/utils/object",
  "constants/chatView"
], function(intentsModelSearch, objUtils, chatViewConstants) {
  "use strict";

  const {MAX_LEAF_NODE_INTENT_RESULTS, MAX_PARENT_INTENT_RESULTS} = chatViewConstants;

  /**
   * Helper to do substring based search on intents.
   *
   * Note: The search results of Intents v1 is based on Level 1 and Level 2 (leaf nodes)
   * intents. So, this function won't give correct results when the level of
   * intents is increased, as the behavior of search for more levels is not defined.
   *
   * There are 2 cases to filter intents:
   * - If we get any match for leaf nodes, we will show the matched leaf nodes (maximum 5)
   * - If we don't get any match for leaf nodes, we will check if we get any match
   *   for Level 1 intents. If we get any match for Level 1 intents, we will show
   *   all the children of those Level 1 intents (maximum 2 Level 1 intents). There
   *   is no maximum limit for leaf node intents for this case.
   *
   * @param {Object} intentsMap - Intents Map
   * @param {String} query - Search query
   * @return {Object} res - Object having searchResults and searchLevel
   * @returns {Object[]} res.searchResults - Sorted map of the matched intent ids and probabilities
   *                     [{intentId: "intent_1_id", probability: 0.3}]
   * @returns {Number} res.searchLevel - The intent level on which search was performed.
   */
  const substringSearch = (intentsMap, query) => {
    const leafNodeIntentIds = [];
    const nonLeafNodeIntentIds = [];
    let res = [];
    query = query.trim().toLowerCase();

    objUtils.forEachKey(intentsMap, (id, intent) => {
      if (intent.label.toLowerCase().indexOf(query) !== -1) {
        if (intent.children && intent.children.length) {
          nonLeafNodeIntentIds.push(id);
        } else {
          leafNodeIntentIds.push(id);
        }
      }
    });

    // If there is any leaf node intent match, show those leaf node intents only.
    if (leafNodeIntentIds.length) {
      res = leafNodeIntentIds.splice(0, MAX_LEAF_NODE_INTENT_RESULTS);
    } else if (nonLeafNodeIntentIds.length) {
      // If there is no leaf node intent match, but there is Level 1 intents match,
      // show the leaf nodes of those intents.
      res = nonLeafNodeIntentIds
        .splice(0, MAX_PARENT_INTENT_RESULTS)
        .reduce((childrenIntentIds, id) => {
          return childrenIntentIds.push(
            ...intentsMap[id].children.splice(0, MAX_LEAF_NODE_INTENT_RESULTS)
          );
        }, []);
    }

    const searchResults = res.map((id) => {
      return {
        intentId: id,
        probability: null
      };
    });

    return {
      searchResults,
      searchLevel: 2 // Substring search is always performed on leaf nodes.
    };
  };

  /**
   * Intents model based search.
   * @param {Object} config
   * @param {Object} config.model - Data related to model
   * @param {Object} config.intentsMap - Intents Map
   * @param {String} config.query - Search query
   * @param {String[]} config.tokenDelimiters - Array of characters using which we want to
   *                   split the query. For example, [" ", ",", "?", "!"]
   * @return {Object} res - Object having searchResults and searchLevel
   * @returns {Object[]} res.searchResults - Sorted map of the matched intent ids and probabilities
   *                     [{intentId: "intent_1_id", probability: 0.3}]
   * @returns {Number} res.searchLevel - The intent level on which search was performed.
   */
  const modelSearch = (config) => {
    const {model, intentsMap, query, tokenDelimiters} = config;

    return intentsModelSearch.match({
      model,
      intentsMap,
      query,
      tokenDelimiters,
      maxNumberOfLeafIntents: MAX_LEAF_NODE_INTENT_RESULTS,
      maxNumberOfParentIntents: MAX_PARENT_INTENT_RESULTS
    });
  };

  return {
    substringSearch,
    modelSearch
  };
});
