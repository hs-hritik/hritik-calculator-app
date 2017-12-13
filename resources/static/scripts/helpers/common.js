/**
 * Common helpers. Contains common functions, etc applicable to more than one
 * part of the app.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 4 Dec, 2017
 */

define ("helpers/common",
  [
    "store",
    "gunpowder/utils/object",
    "constants/message"
  ],
  function (store, objectUtils, messageConstants) {
    "use strict";

    const {
      TYPE: MESSAGE_TYPE
    } = messageConstants;
    /**
     * Determine whether out of business hours logic is applicable based on if
     * the feature is enabled and the current time falls in the out of business
     * hours range.
     * @returns {boolean} - true if it's out of business hours.
     */
    const isOutOfBusinessHours = () => {
      const {
        businessHoursViewState: bhState
      } = store.getState ();

      return bhState.businessHoursEnabled && !bhState.inBusinessHours;
    };

    /**
     * Return end user first message.
     * @returns {Object} - end user first message
     */
    const getEndUserFirstMessage = () => {
      const {chatView, entities} = store.getState ();
      const {endUserFirstMsgId} = chatView;
      let message = null;

      for (const id in entities.messages) {
        if (entities.messages.hasOwnProperty (id) && (id === endUserFirstMsgId)) {
          message = entities.messages [id];
          break;
        }
      }

      return message;
    };

    /**
     * Return the list of FAQ objects (with id and title) that were fetched from
     * the backend based on end user's first message. Return an empty list if no
     * FAQ was sent by the FAQ suggestion engine.
     * @returns {array}
     */
    const getSuggestedFaqs = () => {
      const {
        entities: {
          messages
        }
      } = store.getState ();

      for (const msgId in messages) {
        if (messages.hasOwnProperty (msgId)) {
          const msg = messages [msgId];

          if (msg.type === MESSAGE_TYPE.FAQ && msg.suggestedFaqs) {
            return msg.suggestedFaqs;
          }
        }
      }

      return [];
    };

    return {
      isOutOfBusinessHours,
      getEndUserFirstMessage,
      getSuggestedFaqs
    };
  });
