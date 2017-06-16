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
      return {
        id: `dummy_msg_${msgIdCounter++}`,
        type: MESSAGE_CONSTANTS.TYPE.TEXT,
        body,
        createdTs: new Date (),
        isCustomerMsg: options.isCustomerMsg || true
      };
    };

    return {
      createTextMessage
    };
  });
