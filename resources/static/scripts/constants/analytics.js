/**
 * Constants for analytics.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 29 Nov, 2017
 */

define ("constants/analytics",
  function () {
    "use strict";

    return {
      EVENT: {
        WIDGET_LOAD: "WIDGET_LOAD",
        WIDGET_OPEN: "WIDGET_OPEN",
        CONVERSATION_STARTED: "CONVERSATION_STARTED",
        ISSUE_CREATED: "ISSUE_CREATED",
        MESSAGE_ADDED: "MESSAGE_ADDED"
      },
      SOURCE: {
        API: "API"
      }
    };
  });
