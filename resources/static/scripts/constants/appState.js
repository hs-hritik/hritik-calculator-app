/**
 * App state related constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created July 26, 2017
 */

define ("constants/appState",
  function () {
    "use strict";

    /**
     * The issue states before unification.
     */
    const OLD_ISSUE_STATE = {
      PRE_CHAT: "preChat",
      ACTIVE: "active",
      RESOLVED: "resolved",
      REJECTED: "rejected",
      RESOLVED_BY_FAQ_SUGGESTIONS: "resolved_by_faq_suggestions"
    };

    const ISSUE_STATE = {
      ACTIVE: "active",
      RESOLVED: "resolved",
      REJECTED: "rejected"
    };

    const ISSUE_TYPE = {
      ISSUE: "issue",
      PRE_ISSUE: "preissue"
    };

    const XHR_ISSUE_STATE = {
      PRE_ISSUE: {
        RESOLVED: "resolved",
        REJECTED: "rejected",
        ISSUE_CREATED: "issue-created"
      },
      ISSUE: {
        RESOLVED: "resolved",
        REJECTED: "rejected"
      }
    };

    const PRE_CHAT_STATE = {
      greeting: {
        INITIAL: "initial",
        WAITING_FOR_USER_REPLY: "waiting_for_user_reply",
        COMPLETED: "completed"
      },
      initialUserMessage: {
        INITIAL: "initial",
        COMPLETED: "completed"
      },
      answerBot: {
        INITIAL: "initial",
        FAQS_FETCHED: "faqs_fetched",
        WAITING_FOR_USER_FEEDBACK: "waiting_for_user_feedback",
        COMPLETED: "completed"
      },
      infoBot: {
        INITIAL: "initial",
        CURRENT_FIELD_TO_BE_ASKED: "current_field_to_be_asked",
        CURRENT_FIELD_ASKED: "current_field_asked",
        COMPLETED: "completed"
      }
    };

    const PRE_CHAT_FEATURES = {
      GREETING: "greeting",
      INITIAL_USER_MESSAGE: "initialUserMessage",
      ANSWER_BOT: "answerBot",
      INFO_BOT: "infoBot"
    };

    const DEFAULT_RESET_TIMEOUT = 43200000;      // 12 hours
    const PRE_ISSUE_RESET_TIMEOUT = 86400000; // 24 hours
    const ANON_USER_RESET_TIMEOUT = 604800000; // 7 days.

    const TRIGGER = {
      RESET: "RESET"
    };

    // @TODO: Move this to the XHR_ISSUE_STATE object, getting introduced with
    // one of the next commits.
    // The state of an issue on backend. 5 denotes the rejected state.
    const ISSUE_STATE_RESET = 5;

    return {
      ISSUE_STATE,
      PRE_CHAT_STATE,
      PRE_CHAT_FEATURES,
      DEFAULT_RESET_TIMEOUT,
      PRE_ISSUE_RESET_TIMEOUT,
      ANON_USER_RESET_TIMEOUT,
      TRIGGER,
      ISSUE_TYPE,
      ISSUE_STATE_RESET,
      XHR_ISSUE_STATE,
      OLD_ISSUE_STATE
    };
  });
