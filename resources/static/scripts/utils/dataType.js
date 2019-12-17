/**
 * Data type check utility
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created 5 Jan, 2018
 */

define("utils/dataType", function() {
  "use strict";

  /**
   * Predicate to check given value is object
   * @param {Object} obj - object to validate
   * @returns {Boolean} - whether obj is object
   */
  const isObject = (obj) => {
    return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
  };

  return {
    isObject
  };
});
