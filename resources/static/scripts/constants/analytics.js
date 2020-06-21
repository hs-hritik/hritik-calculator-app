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
      CSAT_SURVEY_SUBMITTED: "SURVEY_SUBMITTED",
      INTENT_SELECTED: "INTENT_SELECTED",
      INTENT_UNSELECTED: "INTENT_UNSELECTED",
      SEARCH_INTENTS: "SEARCH_INTENTS",
      INTENT_TREE_SHOWN: "INTENT_TREE_SHOWN",
      MESSAGE_SENT: "MESSAGE_SENT",
      MESSAGE_ACTION_CLICKED: "MESSAGE_ACTION_CLICKED",
      FEATURE_EXPIRY: "FEATURE_EXPIRY"
    },
    // The PAYLOAD_EVENT constant is to be used with the tracking XHR's payload.
    PAYLOAD_EVENT: {
      ID: "id",
      TIMESTAMP: "timestamp",
      LANGUAGE: "ln",
      DEV_SET_LANGUAGE: "dln",
      // @TODO: Check if the fields below this should be clubbed under new object
      // called ACTION_CODE because the above fields above this comment are used as keys,
      // and the fields below this comment are used as values for the key - `t` which
      // represents the action code
      WIDGET_LOAD: "a",
      WIDGET_OPEN_WITH_ISSUE: "c",
      WIDGET_OPEN_WITHOUT_ISSUE: "i",
      ISSUE_CREATED: "p",
      SUGGESTED_FAQ_READ: "absfr",
      CSAT_REQUESTED: "cbr",
      CSAT_TAKING_SURVEY: "cbts",
      CSAT_SURVEY_SUBMITTED: "cbc",
      INTENT_SELECTED: "sis",
      INTENT_UNSELECTED: "sid",
      SEARCH_INTENTS: "sisr",
      INTENT_TREE_SHOWN: "its",
      MESSAGE_SENT: "m",
      MESSAGE_ACTION_CLICKED: "acl",
      FEATURE_EXPIRY: "te"
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
    },
    // The events which get triggered within this time will be passed to
    // backend in the same XHR.
    // @TODO: Intents: Confirm the batch events timeout value.
    BATCH_EVENTS_TIMEOUT: 3000,
    EXPIRY_EVENT: {
      RESOLUTION_QUESTION: "reopen"
    }
  };
});
