/**
 * Localization/Internationalization (i18n) related constants.
 * @author Shubham Jain <shubham@helpshift.com>
 * @created Mar 26, 2018
 */

define ("constants/localization",
  function () {
    "use strict";

    const UI_STRING_KEYS = {
      // @TODO: Backend keys are not finalised for these strings.
      // They'll fallback to strings in appState.text.
      "resolution_question_accept": "resolutionQuestionAccept",
      "resolution_question_reject": "resolutionQuestionReject",
      "problem_solved_by_faq_suggestions_msg": "problemSolvedByFaqSuggestionsMsg",
      "faq_view_header": "faqViewHeader",
      "info_bot_request_msg": "infoBotRequestMsg",
      "appearance.widget_title":  "chatViewHeader",
      "resolution_question": "chatViewConversationResolutionQuestion",
      "start_new_conversation": "chatViewStartNewConversation",
      "issue_rejection_question": "chatViewIssueRejectionQuestion",
      "greeting": "greetingMsg",
      "end_conversation": "conversationEndNote",
      "close_conversation_btn": "closeConversationBtn",
      "reply_btn_placeholder": "replyBtnPlaceholder",
      "csat_bot.req_msg": "csatBotRequestMsg",
      "csat_bot_response_msg": "csatBotResponseMsg",
      "csat_bot_form_submit_btn": "csatBotFormSubmitBtn",
      "csat_bot_review_placeholder": "csatBotReviewPlaceholder",
      "csat_bot_review_title": "csatBotReviewTitle",
      "csat_view_header": "csatViewHeader",
      "branding": "branding",
      "atch_upload_status": "attachmentUploadingStatus",
      "atch_retry_error": "attachmentRetryError",
      "atch_filesize_error": "attachmentFileSizeError",
      "atch_default_error": "attachmentDefaultError",
      "business_hours_name_label": "businessHoursNameLabel",
      "business_hours_name_placeholder": "businessHoursNamePlaceholder",
      "business_hours_email_label": "businessHoursEmailLabel",
      "business_hours_email_placeholder": "businessHoursEmailPlaceholder",
      "business_hours_msg_label": "businessHoursMessageLabel",
      "business_hours_msg_placeholder": "businessHoursMessagePlaceholder",
      "business_hours_submit_btn": "businessHoursSubmitBtn",
      "business_hours_thanks_msg": "businessHoursThankYouMessage",
      "business_hours.offline_title": "businessHoursViewHeader",
      "business_hours_contact_form_msg": "businessHoursContactFormMessage",
      "business_hours.offline_message": "businessHoursOfflineMessage",
      "dnd_info_text": "dndInfoText",
      "business_hours_atch_size_msg": "businessHoursAttachmentsSizeExceedMsg",
      "business_hours_atch_limit_msg": "businessHoursAttachmentsLimitExceedMsg",
      "email_validation_error": "emailValidationError",
      // @TODO: Confirm retry btn key
      "retry_btn": "retryBtn",
      // @TODO: Confirm key
      "no_internet_connection": "noInternetConnection",
      "unknown_error_reconnecting":"unknownErrorReconnecting",
      "network_error": "networkError"
    };

    return {
      UI_STRING_KEYS
    };
  }
);
