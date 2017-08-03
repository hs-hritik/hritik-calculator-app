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
      INFO_BOT_REQUEST: 3000,
      INFO_BOT_FIELD: 3000
    };

    return {
      TYPE,
      TIMEOUT
    };
  });
