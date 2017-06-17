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

    return {
      TYPE
    };
  });
