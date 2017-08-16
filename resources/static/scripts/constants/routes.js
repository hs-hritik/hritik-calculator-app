/**
 * Routes constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("constants/routes",
  function () {
    "use strict";

    const BASE = "https://api.helpshift.mobi/v1/";

    // @TODO: Update this route when HS API is ready.
    const getWmConfig = (domain) => `${BASE}${domain}/websdk/config`;

    const getCss = () => "/static/css/style.css";

    const getMyIssues = (domain) => `${BASE}${domain}/websdk/my-issues`;

    const postUserReply = (domain, issueId) =>
                           `${BASE}${domain}/websdk/issues/${issueId}/messages/user`;

    const getMessages = (domain, issueId) => `${BASE}${domain}/websdk/issues/${issueId}/messages`;

    const getFaq = (domain, faqId) => `${BASE}${domain}/websdk/faqs/${faqId}`;

    const putFaqFeedback = (domain, faqId, isHelpful) => {
      if (isHelpful) {
        return `${BASE}${domain}/websdk/faqs/${faqId}/helpful`;
      } else {
        return `${BASE}${domain}/websdk/faqs/${faqId}/unhelpful`;
      }
    };

    const getFaqSuggestions = (domain) => `${BASE}${domain}/websdk/faqs/suggest`;

    const postIssue = (domain) => `${BASE}${domain}/websdk/issues`;

    const postCSAT = (domain, issueId) => `${BASE}${domain}/websdk/issues/${issueId}/csat`;

    const postProfile = (domain) => `${BASE}${domain}/websdk/profiles`;

    const putMessagesSeen = (domain, issueId) =>
                             `${BASE}${domain}/websdk/issues/${issueId}/messages-seen`;

    // Route to fetch web socket related config
    const getWsConfig = (domain) => `${BASE}${domain}/websdk/ws-config`;

    // Route to open web socket connection
    const webSocket = (domain, platformId, endpoint, token) =>
                       `${endpoint}/subscribe/websocket/?origin_v3=${token}&` +
                       `platform_id=${platformId}&domain=${domain}`;
    return {
      getWmConfig,
      getCss,
      getMyIssues,
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
      webSocket
    };
  });
