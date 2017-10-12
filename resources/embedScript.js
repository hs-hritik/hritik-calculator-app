/**
 * This JavaScript file is used to keep the debug version of the web chat embed
 * script. This is not to be compiled or/and deployed to the server.
 * The production (minified and built) version of it is deployed with
 * /static/html/demo/index.html file. This file is not executed anywhere in the
 * codebase.
 */

(function () {
  var PLATFORM_ID = "test_platform_20170901110844149-0319dffe2b25f9c",
      DOMAIN = "test";

  window.helpshiftConfig = {
    platformId: PLATFORM_ID,
    domain: DOMAIN
  };
}) ();

(function (doc, scriptId) {
  if (typeof window.Helpshift !== "function") {
    var hs = function () {
      hs.q.push (arguments);
    };
    hs.q = [];

    window.Helpshift = hs;

    var js,
        scriptNode = doc.getElementsByTagName ("script") [0];

    // no-op, if the document already has webChat.js
    if (doc.getElementById (scriptId)) {
      return;
    }

    js = doc.createElement ("script");
    js.async = true;
    js.id = scriptId;
    js.src = "{{ENV_WEB_CHAT_ROOT}}/webChat.js";

    var initializeHelpshift = function () {
      window.Helpshift ("init");
    };

    if (window.attachEvent) {
      js.attachEvent ("onload", initializeHelpshift);
    } else {
      js.addEventListener ("load", initializeHelpshift, false);
    }

    scriptNode.parentNode.insertBefore (js, scriptNode);
  } else {
    window.Helpshift ("update");
  }
}) (document, "hs-chat");