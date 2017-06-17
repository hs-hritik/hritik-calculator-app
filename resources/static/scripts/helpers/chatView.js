/**
 * Chat view helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 16, 2017
 */

define ("helpers/chatView",
  ["constants/message"],
  function (MESSAGE_CONSTANTS) {
    "use strict";

    let msgIdCounter = 0;

    /**
     * Create custom text message.
     * @param {String} body - body of the message.
     * @param {Object} [options] - options to set other fields of the message.
     *                             Currently, only isCustomerMsg is supported.
     * @returns {Object} - message object.
     */
    const createTextMessage = (body, options = {}) => {
      const {isCustomerMsg = true} = options;

      return {
        id: `dummy_msg_${msgIdCounter++}`,
        type: MESSAGE_CONSTANTS.TYPE.TEXT,
        body,
        createdTs: new Date (),
        isCustomerMsg
      };
    };

    /**
     * Create FAQ message object.
     * @param {Array} faqs - array of faq objects (id and title).
     * @returns {Object} - faq message object.
     */
    const createFaqMessage = (faqs = []) => {
      return {
        id: `dummy_msg_${msgIdCounter++}`,
        type: MESSAGE_CONSTANTS.TYPE.FAQ,
        createdTs: new Date (),
        isCustomerMsg: false,
        suggestedFaqs: faqs.slice (0, 3)
      };
    };

    return {
      createTextMessage,
      createFaqMessage
    };
  });
