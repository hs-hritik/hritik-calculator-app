/**
 * CSS color utility
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created 5 Jan, 2018
 */

define("utils/color", function() {
  // @TODO :- Move this util to gunpowder
  "use strict";

  const hexRegExp = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i;

  /**
   * Predicate to check given value is hex value
   * @param {String} value - value to check
   * @returns {Boolean} - whether value is hex value
   */
  const isHexColor = (value) => {
    return hexRegExp.test(value);
  };

  /**
   * Converts a three charater to six character hex color code
   * @param {String} threeCharHexColorCode - Three character hex color code
   * @returns {String} - Six character hex color code
   */
  const convertThreeToSixCharHexColorCode = (threeCharHexColorCode) => {
    const threeCharHexColor = threeCharHexColorCode.slice(1, threeCharHexColorCode.length);

    return `#${threeCharHexColor
      .split("")
      .map((threeCharHex) => {
        return threeCharHex + threeCharHex;
      })
      .join("")}`;
  };

  return {
    isHexColor,
    convertThreeToSixCharHexColorCode
  };
});
