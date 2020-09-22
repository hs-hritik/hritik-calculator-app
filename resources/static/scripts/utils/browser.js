/**
 * Browser related utils.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 16, 2017
 */

define("utils/browser", function() {
  "use strict";

  /**
   * Detects if the current environment is mobile or not.
   * @returns {Boolean}
   */
  const isMobile = () => {
    // eslint-disable-next-line max-len
    const isMobileRegEx = /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop|XBLWP7/i;
    return isMobileRegEx.test(navigator.userAgent);
  };

  /**
   * Extracts browser language.
   * Checks & fallbacks are for browser compatibility,
   * For more info: https://zzz.buzz/2016/01/13/detect-browser-language-in-javascript/
   * @returns {String} - Language code
   */
  const getLanguage = () => {
    const nav = window.navigator;
    return (nav.languages && nav.languages[0]) || nav.language || nav.userLanguage;
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
    return navigator && /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
  };

  /**
   * Returns true if touch events like touchstart etc are supported. We assume
   * here that if ontouchstart is not undefined, then other events like touchmove,
   * and touchend will also be not undefined and infer that touch events are
   * supported.
   * @returns {Boolean}
   */
  const areTouchEventsSupported = () => {
    return typeof window.ontouchstart !== "undefined";
  };

  /**
   * Predicate to return wether current platform/os is iOS
   * @returns {boolean} - whether current platform is iOS
   */
  const isPlatformIos = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };

  /**
   * Predicate to return whether browser is safari
   * @returns {boolean} - whether current browser if safari
   */
  const isBrowserSafari = () => {
    return !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
  };

  /**
   * Return iOS version
   */
  const getIosVersion = () => {
    return navigator.userAgent
      .match(/OS [\d_]+/i)[0]
      .substr(3)
      .split("_")
      .map((n) => parseInt(n, 10))[0];
  };

  return {
    isMobile,
    isPlatformIos,
    isBrowserSafari,
    getLanguage,
    isBot,
    areTouchEventsSupported,
    getIosVersion
  };
});
