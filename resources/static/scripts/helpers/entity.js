/**
 * Entity related helpers.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 14, 2017
 */

define ("helpers/entity",
  [
    "constants/message",
    "gunpowder/utils/object"
  ],
  function (messageConstants, objUtils) {
    "use strict";

    const {TYPE: MESSAGE_TYPES} = messageConstants;

    /**
     * Return processed message entities.
     * @param {Object} messages - unprocessed message entities.
     * @returns {Object} - processed message entities.
     */
    const getProcessedMessageEntities = (messages) => {
      const processedMessages = {};

      objUtils.forEachKey (messages, (id, msg) => {
        const {type: messageType} = msg;

        const msgObj = {
          id: msg.id,
          type: msg.type,
          body: msg.body,
          state: msg.state,
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
        if (messageType === MESSAGE_TYPES.FAQ_WITH_OPTIONS_INPUT) {
          msgObj.suggestedFaqs = msg.faqs.map ((faq) => {
            return {
              id: faq.data.publish_id,
              title: faq.title,
              language: faq.data.language
            };
          });

          processedMessages [id] = msgObj;
        }
      });

      return processedMessages;
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
     * Return processed faqs entity.
     * @param {Object} faqs - unprocessed faqs entitiy.
     * @returns {Object} - processed faqs entities.
     */
    const getProcessedFaqEntities = (faqs) => {
      const processedFaqs = {};

      objUtils.forEachKey (faqs, (id, faq) => {
        processedFaqs [id] = {
          id: faq.id,
          translations: faq.translations
        };
      });

      return processedFaqs;
    };

    /**
     * Return processed authors entities.
     * @param {Object} authors - unprocessed authors entities.
     * @returns {Object} - processed authors entities.
     */
    const getProcessedAuthorEntities = (authors) => {
      const processedAuthors = {};

      objUtils.forEachKey (authors, (id, author) => {
        processedAuthors [id] = {
          id: author.id,
          name: author.name
        };
      });

      return processedAuthors;
    };

    /**
     * Return processed entities.
     * @param {Object} entities - unprocessed entities.
     * @returns {Object} - processed entities.
     */
    const getProcessedEntities = (entities) => {
      if (entities.messages) {
        entities.messages = getProcessedMessageEntities (entities.messages);
      }
      if (entities.faqs) {
        entities.faqs = getProcessedFaqEntities (entities.faqs);
      }
      if (entities.authors) {
        entities.authors = getProcessedAuthorEntities (entities.authors);
      }

      return entities;
    };

    return {
      getProcessedEntities
    };
  });
