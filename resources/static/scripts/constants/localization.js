/**
 * Localization/Internationalization (i18n) related constants.
 * @author Shubham Jain <shubham@helpshift.com>
 * @created Mar 26, 2018
 */

define ("constants/localization",
  function () {
    "use strict";

    const UI_STRING_KEYS = {
      "resolution_accept": "resolutionQuestionAccept",
      "resolution_reject": "resolutionQuestionReject",
      "back": "faqViewHeader",
      "appearance.widget_title":  "chatViewHeader",
      "resolution_question": "chatViewConversationResolutionQuestion",
      "new_conversation": "chatViewStartNewConversation",
      "issue_rejection_question": "chatViewIssueRejectionQuestion",
      "greeting": "greetingMsg",
      "end_conversation": "conversationEndNote",
      "conversation_closed": "conversationClosed",
      "close_conversation_btn": "closeConversationBtn",
      "reply_btn_placeholder": "replyBtnPlaceholder",
      "csat_bot.req_msg": "csatBotRequestMsg",
      "csat_bot_response_msg": "csatBotResponseMsg",
      "csat_bot_form_submit_btn": "csatBotFormSubmitBtn",
      "csat_bot_review_placeholder": "csatBotReviewPlaceholder",
      "csat_bot_review_title": "csatBotReviewTitle",
      "csat_view_header": "csatViewHeader",
      "loading_messages": "pastConversationsLoadingText",
      "branding": "branding",
      "atch_upload_status": "attachmentUploadingStatus",
      "atch_retry_error": "attachmentRetryError",
      "atch_filesize_error": "attachmentFileSizeError",
      "atch_file_type_error": "attachmentFileTypeError",
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
      "email_error": "emailValidationError",
      "retry_button": "retryBtn",
      "network_error": "networkError",
      "reload_page": "userRedactionMessage",
      "message_deleted":"messageDeleted",
      "conversation_deleted":"conversationRedactedMsg",
      "conversations_deleted":"conversationsRedactedMsg",
      "internet_error": "noInternetConnection",
      "connecting_text": "connectingText",
      "system_error": "unknownErrorReconnecting",
      "search_placeholder": "searchPlaceholder",
      "no_search_results": "noSearchResultsText"
    };

    return {
      UI_STRING_KEYS
    };
  }
);
