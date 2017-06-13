/**
 * Routes constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("constants/routes",
  function () {
    "use strict";

    const BASE = "http://api.helpshift.mobi/v1/";

    const myIssues = (domain) => `${BASE}${domain}/webm/my-issues`;
    const userReply = (domain, issueId) => `${BASE}${domain}/webm/issues/${issueId}/messages/user`;

    return {
      myIssues,
      userReply
    };
  });
