/**
 * Message related constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 14, 2017
 */

define ("constants/message",
  function () {
    "use strict";

    const TYPE = {
      TEXT: "Text",
      FAQ: "Faq",
      CONFIRMATION_ACCEPTED: "Confirmation Accepted",
      CONFIRMATION_REJECTED: "Confirmation Rejected"
    };

    // Timeout (in milliseconds) for different system generated message.
    const TIMEOUT = {
      FAQ_SUGGESTIONS_ADDITIONAL_HELP: 10000,
      GET_INFO_REQUEST: 3000,
      GET_INFO_FIELD: 3000
    };

    return {
      TYPE,
      TIMEOUT
    };
  });
