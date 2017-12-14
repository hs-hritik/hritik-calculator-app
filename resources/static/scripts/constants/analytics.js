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
        MESSAGE_ADDED: "MESSAGE_ADDED",
        ANS_BOT_REQUESTED: "ANS_BOT_REQUESTED",
        ANS_BOT_RESULT: "ANS_BOT_RESULT",
        FAQ_READ: "FAQ_READ",
        INFO_BOT_REQUESTED: "INFO_BOT_REQUESTED",
        INFO_BOT_FIELD_CAPTURED: "INFO_BOT_FIELD_CAPTURED",
        ISSUE_DEFLECTION: "ISSUE_DEFLECTION",
        CSAT: "CSAT",
        CSAT_REQUESTED: "CSAT_REQUESTED",
        CSAT_TAKING_SURVEY: "CSAT_TAKING_SURVEY",
        CSAT_SURVEY_SUBMITTED: "SURVEY_SUBMITTED"
      },
      // The PAYLOAD_EVENT constant is to be used with the tracking XHR's payload.
      PAYLOAD_EVENT: {
        PLAT_ID: "platform-id",
        ID: "id",
        DEVICE_ID: "did",
        TIMESTAMP: "timestamp",
        LANGUAGE: "ln",
        USER_ID: "uid",
        PROFILE_ID: "profile-id",
        CONVERSATION_ID: "conv-id",
        WIDGET_LOAD: "a",
        WIDGET_OPEN_WITH_ISSUE: "c",
        WIDGET_OPEN_WITHOUT_ISSUE: "i",
        CONVERSATION_STARTED: "cs",
        ISSUE_CREATED: "p",
        MESSAGE_ADDED: "m",
        ANS_BOT_REQUESTED: "abr",
        ANS_BOT_RESULT: "abrs",
        SUGGESTED_FAQ_READ: "absfr",
        FAQ_READ: "abfr",
        ISSUE_DEFLECTED: "abta",
        ISSUE_NOT_DEFLECTED: "abtaf",
        INFO_BOT_REQUESTED: "ibr",
        INFO_BOT_NAME_CAPTURED: "ibnc",
        INFO_BOT_EMAIL_CAPTURED: "ibec",
        INFO_BOT_FINISHED: "ibf",
        CSAT_REQUESTED: "cbr",
        CSAT_TAKING_SURVEY: "cbts",
        CSAT_SURVEY_SUBMITTED: "cbc"
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
