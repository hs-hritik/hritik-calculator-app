/**
 * JS for redirection page
 * @author Aniket Hendre <aniket@helpshift.com>
 * @created Sep 10, 2018
 */

(function () {
  "use strict";

  /**
   * Create iframe for pid.hs.com
   * @returns {Element} - re-engagement iframe
   */
  var createReEngagementIframe = function () {
    const iframe = document.createElement ("iframe");

    iframe.id = "hs-re-engagement-iframe";
    // @TODO: Replace this with correct re-engagement.html path
    iframe.src = "/html/re-engagement.html";
    iframe.style.display = "none";
    return iframe;
  };

  /*
   * Create & append iframe to the body
   */
  const iframe = createReEngagementIframe ();
  document.body.appendChild (iframe);

}) ();
