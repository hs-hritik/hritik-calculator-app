/**
 * App state related constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created July 26, 2017
 */

define ("constants/appState",
  function () {
    "use strict";

    const ISSUE_STATE = {
      PRE_CHAT: "preChat",
      ACTIVE: "active",
      RESOLVED: "resolved",
      REJECTED: "rejected",
      RESOLVED_BY_FAQ_SUGGESTIONS: "resolved_by_faq_suggestions"
    };

    const PRE_CHAT_STATE = {
      GREETING: {
        INITIAL: "initial",
        WAITING_FOR_USER_REPLY: "waiting_for_user_reply",
        COMPLETED: "completed"
      },
      ANSWER_BOT: {
        INITIAL: "initial",
        FAQS_FETCHED: "faqs_fetched",
        WAITING_FOR_USER_FEEDBACK: "waiting_for_user_feedback",
        COMPLETED: "completed"
      },
      INFO_BOT: {
        INITIAL: "initial",
        CURRENT_FIELD_TO_BE_ASKED: "current_field_to_be_asked",
        CURRENT_FIELD_ASKED: "current_field_asked",
        COMPLETED: "completed"
      }
    };

    return {
      ISSUE_STATE,
      PRE_CHAT_STATE
    };
  });
