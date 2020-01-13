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
   * @return {Object[]} - Search result's intents
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

    return res.map((id) => {
      return {
        intentId: id,
        probability: null
      };
    });
  };

  /**
   * Intents model based search.
   * @param {Object} model - Data related to model
   * @param {Object} intentsMap - Intents Map
   * @param {String} query - Search query
   * @return {Object[]} - Matched intents
   */
  const modelSearch = (model, intentsMap, query) => {
    return intentsModelSearch.match({
      model,
      intentsMap,
      query,
      maxNumberOfLeafIntents: MAX_LEAF_NODE_INTENT_RESULTS,
      maxNumberOfParentIntents: MAX_PARENT_INTENT_RESULTS
    });
  };

  return {
    substringSearch,
    modelSearch
  };
});
