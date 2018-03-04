/**
 * Routes constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("constants/routes",
  function () {
    "use strict";

    const WEB_SDK_API_ROOT = "{{ENV_API_ROOT}}";
    const BASE = `${WEB_SDK_API_ROOT}/websdk/v1/`;

    const getWmConfig = (domain, platformId) => `${BASE}${domain}/platforms/${platformId}/config`;

    const getCss = () => "/css/style.css";

    const getIssues = (domain) => `${BASE}${domain}/issues`;

    const postUserReply = (domain, issueId) =>
                           `${BASE}${domain}/issues/${issueId}/messages/user`;

    const getMessages = (domain, issueId) => `${BASE}${domain}/issues/${issueId}/messages`;

    const getFaq = (domain, faqId) => `${BASE}${domain}/faqs/${faqId}`;

    const putFaqFeedback = (domain, faqId, isHelpful) => {
      if (isHelpful) {
        return `${BASE}${domain}/faqs/${faqId}/helpful`;
      } else {
        return `${BASE}${domain}/faqs/${faqId}/unhelpful`;
      }
    };

    const getFaqSuggestions = (domain) => `${BASE}${domain}/faqs/suggest`;

    const postIssue = (domain) => `${BASE}${domain}/issues`;

    const postCSAT = (domain, issueId) => `${BASE}${domain}/issues/${issueId}/csat`;

    const postProfile = (domain) => `${BASE}${domain}/profiles`;

    const putMessagesSeen = (domain, issueId) =>
                             `${BASE}${domain}/issues/${issueId}/messages-seen`;

    // Route to fetch web socket related config
    const getWsConfig = (domain) => `${BASE}${domain}/ws-config`;

    // Route to open web socket connection
    const webSocket = (domain, platformId, endpoint, token) =>
                       `${endpoint}/subscribe/websocket/?origin_v3=${token}&` +
                       `platform_id=${platformId}&domain=${domain}`;

    const postAnalyticsEvent = (domain) => `${WEB_SDK_API_ROOT}/events/v1/${domain}/websdk/`;

    return {
      getWmConfig,
      getCss,
      getIssues,
      postUserReply,
      getMessages,
      getFaq,
      putFaqFeedback,
      getFaqSuggestions,
      postIssue,
      postCSAT,
      postProfile,
      putMessagesSeen,
      getWsConfig,
      webSocket,
      postAnalyticsEvent
    };
  });
