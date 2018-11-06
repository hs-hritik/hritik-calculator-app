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

    const getWmConfig = (domain) => `${BASE}${domain}/config`;

    // @TODO: This is not an ideal solution. Either make this configurable or
    // implement an automatic cache busting solution based on a file's content.
    // Also, update this in html/index.html, messenger.js, and requireConfig.js.
    const getCss = () => "/css/style.css?v=2.10.1";

    // @NOTE - Used to create issue out of business hours
    const postIssue = (domain) => `${BASE}${domain}/issues`;

    const postUserReply = (domain, issueId, issueType) => {
      return `${BASE}${domain}/${issueType}/${issueId}/messages`;
    };

    const getConversationUpdates = (domain) => `${BASE}${domain}/conversations/updates`;

    const getConversationHistory = (domain) => `${BASE}${domain}/conversations/history`;

    const getFaq = (domain, faqId) => `${BASE}${domain}/faqs/${faqId}`;

    const postPreIssue = (domain) => `${BASE}${domain}/preissues`;

    const putResetPreIssue = (domain, issueId) => `${BASE}${domain}/preissues/${issueId}`;

    const postCSAT = (domain, issueId) => `${BASE}${domain}/issues/${issueId}/csat`;

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

    const postSuggestedFaqRead = (domain) => `${BASE}${domain}/faqs_suggestion_read`;

    return {
      getWmConfig,
      getCss,
      getFaq,
      postPreIssue,
      putResetPreIssue,
      postCSAT,
      putMessages,
      getWsConfig,
      webSocket,
      postAnalyticsEvent,
      postUserReply,
      getConversationUpdates,
      getConversationHistory,
      postSuggestedFaqRead,
      postIssue
    };
  });
