/**
 * DOM Helpers
 * @author Nachiket Kakatkar <nachiket@helpshift.com>
 * @created Feb 06, 2019
 * Copied from moby/domActions.js
 */

define("helpers/dom", function() {
  "use strict";

  /**
   * Method to scroll a given container to bring a child in focus.
   * Takes:
   * 1. container: DOM node of the container
   * 2. target: target child inside container
   * 3. fallbackScroll: Set cursor position to this value if target child is not found.
   */
  const scrollIntoView = (container, target, fallbackScroll) => {
    let targetTop, targetBottom;

    if (target) {
      targetTop = target.offsetTop;
      targetBottom = targetTop + target.offsetHeight;

      if (container.scrollTop > targetTop) {
        container.scrollTop = targetTop;
      } else if (container.scrollTop + container.offsetHeight < targetBottom) {
        container.scrollTop = targetBottom - container.offsetHeight;
      }
    } else if (fallbackScroll >= 0) {
      container.scrollTop = fallbackScroll;
    }
  };

  return {
    scrollIntoView
  };
});
