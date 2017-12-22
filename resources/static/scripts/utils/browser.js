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

  /**
   * Extracts browser language.
   * Checks & fallbacks are for browser compatibility,
   * For more info: https://zzz.buzz/2016/01/13/detect-browser-language-in-javascript/
   * @returns {String} - Language code
   */
  const getLanguage = () => {
    const nav = window.navigator;
    return nav.languages && nav.languages[0] || nav.language || nav.userLanguage;
  };

  /**
   * Determine if the current environment is search engine bots, crawlers, etc by
   * reading the user agent string and looking for the UA strings used by the most
   * common search engine bots and crawler programs.
   * For more discussion on the solution, please see
   * https://stackoverflow.com/a/20084661/1093247
   * https://webmasters.stackexchange.com/a/64805
   * @returns {boolean}
   */
  const isBot = () => {
    return navigator && (
      /bot|googlebot|crawler|spider|robot|crawling/i.test (navigator.userAgent)
    );
  };

  return {
    isMobile,
    getLanguage,
    isBot
  };
});
