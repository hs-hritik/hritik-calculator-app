/**
 * Intents Model search
 * @author Manish Garg <manish@helpshift.com>
 * @created Dec 27, 2019
 */

define("helpers/intentModelSearch", ["gunpowder/utils/object"], function(objUtils) {
  "use strict";

  /**
   * Convert log probabilities to normalized probabilities
   * @param {Number[]} probabilities
   * @returns {Number[]} - Normalized probabilities
   */
  const _normalizeProbabilities = (probabilities) => {
    // @TODO: Add example values for better understanding.
    const maxProbability = probabilities.reduce((maxProb, prob) => Math.max(maxProb, prob));

    // Convert log probabilities to exp form
    probabilities = probabilities.map((probability) => Math.exp(probability - maxProbability));

    const totalProbability = probabilities.reduce((total, probability) => total + probability, 0);

    // Normalize probabilities so that sum of all probabilities is 1
    return probabilities.map((probability) => probability / totalProbability);
  };

  /**
   * Combine probabilities and intent ids to create a list of objects
   * Also sort the list according to probability (from high to low).
   *
   * @param {Number[]} probabilities - probabilities of intent ids
   * @param {String[]} intentIds - Intent ids
   * @returns {Object[]} - Sorted map of all intent ids and probabilities.
   *                      [{intentId: "intent_1_id", probability: 0.3}]
   */
  const _mapAndRankProbabilities = (probabilities, intentIds) => {
    return intentIds
      .map((id, index) => {
        return {
          intentId: id,
          probability: probabilities[index]
        };
      })
      .sort((a, b) => b.probability - a.probability);
  };

  /**
   * Calculate the child intent probabilities using the model.
   *
   * @param {Object} model - Intents model.
   * @param {String[]} words - The array of strings on which we want to run the model.
   * @returns {Number[]} - The probability of each intent for the given list of words. Its length
   *                       is equal to model.intentIds
   */
  const _getChildProbabilities = (model, words) => {
    const {
      vocabulary,
      weights: {wordIntentProbabilities, intentsBaseProbabilities}
    } = model;

    const childProbabilities = words.reduce((intentProbabilities, word) => {
      // Find the given word in the model's vocabulary
      const wordIndex = vocabulary.indexOf(word);

      // The probabilities won't be updated if the model doesn't have any data related
      // to given word.
      if (wordIndex === -1) {
        return intentProbabilities;
      }

      // If the word is found in the model's vocabulary, increase the probability of
      // each intent using wordIntentProbabilities
      return intentProbabilities.map((intentProbability, intentIndex) => {
        return intentProbability + wordIntentProbabilities[wordIndex][intentIndex];
      });
    }, intentsBaseProbabilities);

    // Since we are adding the probabilities, normalize them to keep the sum of all
    // the probabilities equal to one.
    return _normalizeProbabilities(childProbabilities);
  };

  /**
   * Calculate the number of intents that should be shown.
   * If the intent with the highest probability has probability greater than
   * the confidence threshold, this function would return the number of intents
   * to show to the users.
   * Otherwise, 0 is returned which means no leaf intents can be shown due to less
   * probability.
   *
   * @param {Object[]} mappedIntentProbabilities - Ranked intents probabilities
   *                   - [{intentId: "", probability: 0.3}]
   * @param {Object} modelParameters - Model parameters
   * @param {Number} modelParameters.confidenceThreshold - Minimum confidence threshold
   *                 required for the topmost intent.
   *                 Note: This confidence threshold is only applicable for topmost intent,
   *                 not for other intents. For other intents, we use the maxCombinedConfidence.
   * @param {Number} modelParameters.maxCombinedConfidence - Maximum combined threshold.
   *                 This parameter defines the maximum number of intents. When the sum of
   *                 probabilities of the intents is greater than maximum combined threshold,
   *                 we don't consider more intents.
   * @param {Number} maxNumberOfIntents - The maximum limit for the intents count.
   * @returns {Number} - Number of intents to be shown.
   */
  const _getNumberOfIntents = (mappedIntentProbabilities, modelParameters, maxNumberOfIntents) => {
    const {confidenceThreshold, maxCombinedConfidence} = modelParameters;

    // If the highest probability is less than the confidence threshold, we won't show
    // any leaf intents.
    if (mappedIntentProbabilities[0].probability < confidenceThreshold) {
      return 0;
    }

    let combinedConfidence = 0;
    let index = 0;

    // Add the probabilities until we reach the maximum combined threshold.
    while (index < mappedIntentProbabilities.length && combinedConfidence < maxCombinedConfidence) {
      combinedConfidence += mappedIntentProbabilities[index].probability;
      index++;
    }

    return Math.min(index, maxNumberOfIntents);
  };

  /**
   * Split the query into words.
   * @param {String} query
   * @param {String[]} tokenDelimiters - Array of characters using which we want to
   *                   split the query. For example, [" ", ",", "?", "!"]
   * @returns {String[]} - List of words in the query split by spaces
   */
  const _splitQuery = (query, tokenDelimiters) => {
    const regexStr = "\\" + tokenDelimiters.join("|\\");
    const regex = new RegExp(regexStr, "gm");

    return query.split(regex);
  };

  /**
   * Calculate the parent probabilities by summing up all the leaf/child intent probabilities,
   * and return the child of the parents which have high probability.
   *
   * @param {Object[]} mappedIntentProbabilities - Intent probabilities of leaf intents.
   *                   Structure: [{intentId: "", probability: 0.03}]
   * @param {Object} config - Config
   * @param {Object} config.intentsMap
   * @param {Number} config.maxNumberOfParentIntents
   * @returns {Object[]} - Sorted map of the matched intent ids and probabilities
   *                      [{intentId: "intent_1_id", probability: 0.3}]
   */
  const _matchParentIntents = (mappedIntentProbabilities, config) => {
    const parentProbabilitiesMap = {};
    const {intentsMap, maxNumberOfParentIntents} = config;

    // Create the parent intents map which has the sum of all the child intents,
    // and the array of child intents as well
    mappedIntentProbabilities.forEach((intentProbability) => {
      const {intentId, probability} = intentProbability;
      const {parentId} = intentsMap[intentId];

      if (!parentProbabilitiesMap[parentId]) {
        parentProbabilitiesMap[parentId] = {
          intentId: parentId,
          probability: 0,
          children: []
        };
      }

      const parentProbability = parentProbabilitiesMap[parentId];
      parentProbability.probability += parentProbability.probability + probability;
      parentProbability.children.push(intentProbability);
    });

    // Convert the parent probabilities map to array.
    // Sort the parent probabilities array according to probability.
    // Take the top X parent intents (where X = maxNumberOfParentIntents).
    // Take all the child intents of each parent.
    return objUtils
      .getAllValues(parentProbabilitiesMap)
      .sort((a, b) => b.probability - a.probability)
      .splice(0, maxNumberOfParentIntents)
      .reduce((childProbablities, parentProbability) => {
        return [...childProbablities, ...parentProbability.children];
      }, []);
  };

  /**
   * Match the intents for the given query.
   *
   * Calculate the probability of each leaf intent using the model.
   * If the highest probability of the leaf intent is greater than confidence threshold,
   * return the leaf intents.
   * If it is less than confidence threshold, calculate the probabilities of parent intents
   * by summing up the probabilities of child intents, and return the leaf intents of the
   * topmost parent intents.
   *
   * Note: No model algo is used for calcualting the parent intents probabilities. It is used
   * only for leaf intents. For parent intents, we just add up the child intent probabilities
   * of those parents.
   *
   * @param {Object} config
   * @param {Object} config.intentsMap - Intents detail map
   * @param {Object} config.model - Intent model.
   * @param {String[]} config.model.intentIds - Array of all the leaf intent ids.
   * @param {String[]} config.model.vocabulary - Array of all the available words.
   * @param {Object} config.model.weights - Model weights.
   * @param {Number[][]} config.model.weights.wordIntentProbabilities - Probability of each word
   *                     for an intent. It is a multi-dimensional array. The length of outer array
   *                     is equal to length of model.vocabulary array, and the length of each
   *                     inner array is equal to model.intentIds
   * @param {Number[]} config.model.weights.intentsBaseProbabilities - Base probability of each
   *                   intent. While calculating the probability of the intents, we will start
   *                   with this number instead of zero. Its length is equal to model.intentIds
   * @param {Object} config.model.parameters - Model parameters
   * @param {Number} config.model.parameters.confidenceThreshold - The minimum score/probability
   *                 required to consider if an intent is a match for the given sentence.
   * @param {Number} config.model.parameters.maxCombinedConfidence - We will keep on finding the
   *                 intents until the sum of score/probability of all the matched intents is less
   *                 than the maximum combined threshold value.
   * @param {Number} config.maxNumberOfLeafIntents - Maximum number of leaf intents which
   *                 we want to show.
   * @param {Number} config.maxNumberOfParentIntents - Maximum number of parent intents which
   *                 we want to show.
   * @param {String} config.query - The query for which we want to find the suitable intents
   *                 (user typed message).
   * @param {String[]} config.tokenDelimiters - Array of characters using which we want to
   *                   split the query. For example, [" ", ",", "?", "!"]
   * @returns {Object[]} - Sorted map of the matched intent ids and probabilities
   *                      [{intentId: "intent_1_id", probability: 0.3}]
   */
  const match = (config) => {
    const {model, query, maxNumberOfLeafIntents, tokenDelimiters} = config;

    const words = _splitQuery(query.toLowerCase(), tokenDelimiters);
    const intentProbabilities = _getChildProbabilities(model, words);
    const mappedIntentProbabilities = _mapAndRankProbabilities(
      intentProbabilities,
      model.intentIds
    );
    const numberOfIntents = _getNumberOfIntents(
      mappedIntentProbabilities,
      model.parameters,
      maxNumberOfLeafIntents
    );

    // If number of intents is greater than 0, return the intents.
    if (numberOfIntents > 0) {
      return mappedIntentProbabilities.splice(0, numberOfIntents);
    }

    // Otherwise match the parent intents and return their child intents.
    return _matchParentIntents(mappedIntentProbabilities, config);
  };

  return {
    match
  };
});
