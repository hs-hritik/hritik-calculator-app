/**
 * CSS color utility
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created 5 Jan, 2018
 */

define ("utils/color",
  function () {
    // @TODO :- Move this util to gunpowder
    "use strict";

    const hexRegExp = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i;

    /**
     * Predicate to check given value is hex value
     * @param {String} value - value to check
     * @returns {Boolean} - whether value is hex value
     */
    const isHexColor = (value) => {
      return hexRegExp.test (value);
    };

    return {
      isHexColor
    };
  }
);
