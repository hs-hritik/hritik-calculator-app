/**
 * Routes constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("constants/routes",
  function () {
    "use strict";

    const WEB_SDK_API_ROOT = "{{ENV_API_ROOT}}";
    const BASE = `${WEB_SDK_API_ROOT}/websdk/`;

    // @TODO - Clean up unwanted routes
    const getWmConfig = (domain) => `${BASE}${domain}/config`;

    const getCss = () => "/css/style.css";

    const getIssues = (domain) => `${BASE}${domain}/issues`;

    const postUserReply = (domain, issueId, issueType) => {
      return `${BASE}${domain}/${issueType}/${issueId}/messages`;
    };

    const getIssuesAndMessages = (domain) => `${BASE}${domain}/messages`;

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

    const postPreIssue = (domain) => `${BASE}${domain}/preissues`;

    const putResetPreIssue = (domain, issueId) => `${BASE}${domain}/preissues/${issueId}`;

    const postCSAT = (domain, issueId) => `${BASE}${domain}/issues/${issueId}/csat`;

    const postProfile = (domain) => `${BASE}${domain}/profiles`;

    const putMessages = (domain, issueId, issueType) => {
      return `${BASE}${domain}/${issueType}/${issueId}/messages`;
    };

    // Route to fetch web socket related config
    const getWsConfig = (domain) => `${BASE}${domain}/ws-config`;

    // Route to open web socket connection
    const webSocket = (domain, platformId, endpoint, token) =>
                       `${endpoint}/subscribe/websocket/?origin_v3=${token}&` +
                       `platform_id=${platformId}&domain=${domain}`;

    const postAnalyticsEvent = (domain) => `${WEB_SDK_API_ROOT}/events/v1/${domain}/websdk/`;

    const postSuggestedFaqRead = (domain) => `${BASE}${domain}/faqs/suggestion_read`;

    const putMigrateProfile = (domain) => `${BASE}${domain}/profiles`;

    return {
      getWmConfig,
      getCss,
      getIssues,
      getMessages,
      getFaq,
      putFaqFeedback,
      getFaqSuggestions,
      postPreIssue,
      putResetPreIssue,
      postCSAT,
      postProfile,
      putMessages,
      getWsConfig,
      webSocket,
      postAnalyticsEvent,
      postUserReply,
      getIssuesAndMessages,
      postSuggestedFaqRead,
      putMigrateProfile
    };
  });
