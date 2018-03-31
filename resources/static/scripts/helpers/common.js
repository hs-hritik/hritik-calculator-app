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
    "gunpowder/utils/uuid",
    "constants/message",
    "constants/businessHoursView"
  ],
  function (store, objectUtils, getUuid, messageConstants, bhConstants) {
    "use strict";

    /* eslint-disable max-len */
    const EMAIL_REGEX = /^[\p{L}\p{N}\p{M}\p{S}\p{Po}A-Z0-9._%'-]{1,64}(\+.*)?@[\p{L}\p{M}\p{N}\p{S}A-Z0-9'.-]{1,246}\.[\p{L}\p{M}\p{N}\p{S}A-Z]{1,8}[^\s]$/i;
    /* eslint-enable max-len */

    // 1 non space char + 1 to 748 any char + 1 non space char
    const USER_ID_REGEX = /^[^\s].{1,748}[^\s]$/;

    const {
      TYPE: MESSAGE_TYPE
    } = messageConstants;

    const {
      OFFLINE_BEHAVIOUR
    } = bhConstants;

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
     * Determine whether the hide widget business hours configuration applies.
     * @returns {boolean} - True, if does.
     */
    const isWidgetHiddenOutOfBusinessHours = () => {
      const {
        businessHoursViewState: {
          offlineBehaviour
        }
      } = store.getState ();

      // Return true IF
      // it is out of business hours AND
      // the offline behavior selected is `hide_widget`
      return isOutOfBusinessHours () && offlineBehaviour === OFFLINE_BEHAVIOUR.HIDE_WIDGET;
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

    /**
     * Get anonymous user id string, in the following format.
     * "hsft_anon_<timestamp>-<15 random alphanumeric characters>"
     * @returns {string}
     */
    const getAnonUserId = () => {
      return "hsft_anon_" +
        Date.now () + "-" +
        getUuid ().replace (/-/g, "").substring (0, 15);
    };

    /**
     * Determine whether an active preIssue or issue exists in the system.
     * @returns {boolean} - true, if an active preIssue/issue exists.
     */
    const doesActiveIssueExist = () => store.getState ().appState.issueExists;

    /**
     * Validate email.
     * Ideally this should be a part of `gunpowder`, but it already has an email
     * validation fn and its email regex doesn't match exactly with what BE and
     * mobile SDKs use. In web chat, we are going to have the same email regex
     * as elsewhere.
     * TODO: Consider updating `gunpowder's` email regex.
     * @param {string} value - email to validate.
     * @returns {boolean} - true if the email is valid.
     */
    const isEmailValid = (value) => EMAIL_REGEX.test (value);

    /**
     * Validate userId (passed with `helpshiftConfig`).
     * A valid userId
     * should be <= 750 characters
     * should not contain leading or trailing spaces
     * @param {string} value - userId to validate.
     * @returns {boolean} - true if the userId is valid.
     */
    const isUserIdValid = (value) => USER_ID_REGEX.test (value);

    return {
      isOutOfBusinessHours,
      isWidgetHiddenOutOfBusinessHours,
      getEndUserFirstMessage,
      getSuggestedFaqs,
      getAnonUserId,
      doesActiveIssueExist,
      isEmailValid,
      isUserIdValid
    };
  });
