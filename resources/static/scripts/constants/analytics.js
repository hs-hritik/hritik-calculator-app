/**
 * Constants for analytics.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 29 Nov, 2017
 */

define("constants/analytics", function() {
  "use strict";

  return {
    // The EVENT constant is to be used in web chat internal logic and not with
    // the tracking XHR's payload.
    EVENT: {
      WIDGET_LOAD: "WIDGET_LOAD",
      WIDGET_OPEN: "WIDGET_OPEN",
      SUGGESTED_FAQ_READ: "SUGGESTED_FAQ_READ",
      ISSUE_CREATED: "ISSUE_CREATED",
      CSAT: "CSAT",
      CSAT_REQUESTED: "CSAT_REQUESTED",
      CSAT_TAKING_SURVEY: "CSAT_TAKING_SURVEY",
      CSAT_SURVEY_SUBMITTED: "SURVEY_SUBMITTED"
    },
    // The PAYLOAD_EVENT constant is to be used with the tracking XHR's payload.
    PAYLOAD_EVENT: {
      ID: "id",
      TIMESTAMP: "timestamp",
      LANGUAGE: "ln",
      DEV_SET_LANGUAGE: "dln",
      WIDGET_LOAD: "a",
      WIDGET_OPEN_WITH_ISSUE: "c",
      WIDGET_OPEN_WITHOUT_ISSUE: "i",
      ISSUE_CREATED: "p",
      SUGGESTED_FAQ_READ: "absfr",
      CSAT_REQUESTED: "cbr",
      CSAT_TAKING_SURVEY: "cbts",
      CSAT_SURVEY_SUBMITTED: "cbc"
    },
    // The TRIGGER constant is to be used in web chat internal logic and not with
    // the tracking XHR's payload.
    TRIGGER: {
      API: "API"
    },
    // The PAYLOAD_SOURCE constant is to be used with the tracking XHR's payload.
    PAYLOAD_SOURCE: {
      API: "js",
      USER: "u"
    }
  };
});
