/**
 * CSS color utility
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created 5 Jan, 2018
 */

define("utils/color", function() {
  // @TODO :- Move this util to gunpowder
  "use strict";

  const hexRegExp = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i;

  const THREE_CHAR_HEX_CODE_LENGTH = 4;

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
   * @param {String} hexColorCode - Hex color code
   * @returns {String} - Six character hex color code
   */
  const convertThreeToSixCharHexColorCode = (hexColorCode) => {
    // Return early if the color code is already of six characters
    if (hexColorCode !== THREE_CHAR_HEX_CODE_LENGTH) {
      return hexColorCode;
    }

    const threeCharHexColor = hexColorCode.slice(1, hexColorCode.length);

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
