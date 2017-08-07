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
    // @TODO: Change the timeout according to design spec.
    // Temporary changing the timeout to speed up the testing process.
    const TIMEOUT = {
      FAQ_SUGGESTIONS_ADDITIONAL_HELP: 1000,
      INFO_BOT_REQUEST: 500,
      INFO_BOT_FIELD: 500
    };

    return {
      TYPE,
      TIMEOUT
    };
  });
