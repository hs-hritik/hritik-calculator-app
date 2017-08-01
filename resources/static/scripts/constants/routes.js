/**
 * Routes constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("constants/routes",
  function () {
    "use strict";

    const BASE = "https://api.helpshift.com/v1/";

    // @TODO: Update this route when HS API is ready.
    const getWmConfig = (domain) => `${BASE}${domain}/webm/config`;

    const getMyIssues = (domain) => `${BASE}${domain}/webm/my-issues`;

    const postUserReply = (domain, issueId) =>
                           `${BASE}${domain}/webm/issues/${issueId}/messages/user`;

    const getMessages = (domain, issueId) => `${BASE}${domain}/webm/issues/${issueId}/messages`;

    const getFaq = (domain, faqId) => `${BASE}${domain}/faqs/${faqId}`;

    const putFaqFeedback = (domain, faqId, isHelpful) => {
      if (isHelpful) {
        return `${BASE}${domain}/webm/faqs/${faqId}/helpful`;
      } else {
        return `${BASE}${domain}/webm/faqs/${faqId}/unhelpful`;
      }
    };

    const getFaqSuggestions = (domain) => `${BASE}${domain}/faqs/suggest`;

    const postIssue = (domain) => `${BASE}${domain}/webm/issues`;

    const postCSAT = (domain, issueId) => `${BASE}${domain}/webm/issues/${issueId}/csat`;

    const postProfile = (domain) => `${BASE}${domain}/webm/profiles`;

    const putMessagesSeen = (domain, issueId) =>
                             `${BASE}${domain}/webm/issues/${issueId}/messages-seen`;

    return {
      getWmConfig,
      getMyIssues,
      postUserReply,
      getMessages,
      getFaq,
      putFaqFeedback,
      getFaqSuggestions,
      postIssue,
      postCSAT,
      postProfile,
      putMessagesSeen
    };
  });
