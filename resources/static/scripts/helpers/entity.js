/**
 * Entity related helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 14, 2017
 */

define ("helpers/entity",
  [
    "constants/message"
  ],
  function (messageConstants) {
    "use strict";

    const {TYPE: MESSAGE_TYPES} = messageConstants;

    /**
     * Return processed message entitiy
     * @param {Object} messages - unprocessed message entitiy
     * @returns {Object} - processed message entitiy
     */
    const getProcessedMessages = (messages) => {
      return messages.map ((msg) => {
        const {type: messageType} = msg;

        const msgObj = {
          id: msg.id,
          type: msg.type,
          body: msg.body,
          state: msg.state,
          states: {}, // Applicable only in case of attachments
          createdTs: msg.created_at,
          author: msg.author,
          isCustomerMsg: (msg.origin !== "admin"),
          attachments: getProcessedAttachments (msg)
        };

        if (msg.chatbot_info) {
          msgObj.chatBotInfo = msg.chatbot_info;
        }

        // If message has faq data, process it
        // FAQ data will be part of bot message
        if (messageType === MESSAGE_TYPES.FAQ_LIST_WITH_OPTION_INPUT) {
          msgObj.suggestedFaqs = msg.faqs.map ((faq) => {
            return {
              id: faq.data.publish_id,
              title: faq.title,
              language: faq.data.language
            };
          });
        }

        return msgObj;
      });
    };

    /**
     * Returns processed attachment.
     * @param {Array} attachments - unprocessed message attachment.
     * @returns {Array} - processed attachments.
     */
    // @TODO :- Remove 'msg' param after BE fix, 'attachments' will be the
    // original parameter
    const getProcessedAttachments = (msg) => {
      // @TODO :- Remove array of attachment after BE fix
      const attachments = msg.attachments || (msg.attachment && [msg.attachment]);

      if (!attachments) {
        return null;
      }

      return attachments.map ((attachment) => {
        return {
          url: attachment.url,
          contentType: attachment.content_type,
          fileName: attachment.file_name
        };
      });
    };

    /**
     * Return processed faq entity.
     * @param {Object} faq - unprocessed faq entitiy
     * @returns {Object} - processed faq entitiy
     */
    const getProcessedFaq = (faq) => {
      return {
        id: faq.id,
        translations: faq.translations
      };
    };

    return {
      getProcessedMessages,
      getProcessedFaq
    };
  });
