/**
 * Accessibility constants.
 * @author Riya Bagaria <riya@helpshift.com>
 * @created Aug 30, 2019
 */

define ("constants/accessibility",
  function () {
    "use strict";

    const DIRECTIONS = {
      FORWARD: "forward",
      BACKWARD: "backward"
    };

    const KEYCODES = {
      ENTER: 13,
      UP_ARROW: 38,
      DOWN_ARROW: 40,
      RIGHT_ARROW: 39,
      LEFT_ARROW: 37,
      TAB: 9
    };

    return {
      DIRECTIONS,
      KEYCODES
    };
  }
);
