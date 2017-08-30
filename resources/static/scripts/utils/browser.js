/**
 * Browser related utils.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 16, 2017
 */

define ("utils/browser",
function () {
  "use strict";

  /**
   * Detects if the current environment is mobile or not.
   * @returns {Boolean}
   */
  const isMobile = () => {
    const screenWidth = screen.width,
          winWidth = window.innerWidth,
          width = (winWidth && winWidth <= screenWidth) ? winWidth : screenWidth;

    return (
      width < 600 && (
        ("ontouchstart" in window) ||
        (window.DocumentTouch && document instanceof window.DocumentTouch) ||
        (/IEMobile|XBLWP7/).test (navigator.userAgent)
      )
    );
  };

  return {
    isMobile
  };
});
