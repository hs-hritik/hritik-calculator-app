/**
 * Constants for analytics.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 29 Nov, 2017
 */

define ("constants/analytics",
  function () {
    "use strict";

    return {
      // The EVENT constant is to be used in web chat internal logic and not with
      // the tracking XHR's payload.
      EVENT: {
        WIDGET_LOAD: "WIDGET_LOAD",
        WIDGET_OPEN: "WIDGET_OPEN",
        CONVERSATION_STARTED: "CONVERSATION_STARTED",
        ISSUE_CREATED: "ISSUE_CREATED",
        MESSAGE_ADDED: "MESSAGE_ADDED"
      },
      // The PAYLOAD_EVENT constant is to be used with the tracking XHR's payload.
      PAYLOAD_EVENT: {
        WIDGET_LOAD: "a",
        WIDGET_OPEN_WITH_ISSUE: "c",
        WIDGET_OPEN_WITHOUT_ISSUE: "i",
        CONVERSATION_STARTED: "cs",
        ISSUE_CREATED: "p",
        MESSAGE_ADDED: "m"
      },
      // The SOURCE constant is to be used in web chat internal logic and not with
      // the tracking XHR's payload.
      SOURCE: {
        API: "API"
      },
      // The PAYLOAD_SOURCE constant is to be used with the tracking XHR's payload.
      PAYLOAD_SOURCE: {
        API: "js",
        USER: "u"
      }
    };
  });
