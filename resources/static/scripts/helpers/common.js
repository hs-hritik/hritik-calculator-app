/**
 * Common helpers. Contains common functions, etc applicable to more than one
 * part of the app.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 4 Dec, 2017
 */

define("helpers/common", [
  "store",
  "gunpowder/utils/array",
  "gunpowder/utils/uuid",
  "constants/message",
  "constants/businessHoursView",
  "constants/appState",
  "constants/activeView"
], function(
  store,
  arrayUtils,
  getUuid,
  messageConstants,
  bhConstants,
  appStateConstants,
  ACTIVE_VIEW
) {
  "use strict";

  const {ISSUE_TYPE} = appStateConstants;

  /* eslint-disable max-len */
  const EMAIL_REGEX = /^[\p{L}\p{N}\p{M}\p{S}\p{Po}A-Z0-9._%'-]{1,64}(\+.*)?@(?:[\p{L}\p{M}\p{N}\p{S}A-Z0-9'-]+\.){1,246}[\p{L}\p{M}\p{N}\p{S}A-Z]{1,8}[^\s]$/i;
  /* eslint-enable max-len */

  /**
   * Number regex which allows single '.' in between digits
   */
  const NUMBER_WITH_DECIMAL_REG_EX = /^\d*(?:\.\d+)?$/;

  const {TYPE: MESSAGE_TYPE} = messageConstants;

  const {OFFLINE_BEHAVIOUR} = bhConstants;

  const DOES_BROWSER_SUPPORT_DATE_INPUT = (() => {
    const dateInput = document.createElement("input");
    dateInput.setAttribute("type", "date");

    // If browser doesn't support input type="date", the type will be "text"
    // and below comparison will return false
    return dateInput.type === "date";
  })();

  /**
   * Determine whether out of business hours logic is applicable based on if
   * the feature is enabled and the current time falls in the out of business
   * hours range.
   * @returns {boolean} - true if it's out of business hours.
   */
  const isOutOfBusinessHours = () => {
    const {businessHoursViewState: bhState} = store.getState();

    return bhState.businessHoursEnabled && !bhState.inBusinessHours;
  };

  /**
   * Determine whether the hide widget business hours configuration applies.
   * @returns {boolean} - True, if does.
   */
  const isWidgetHiddenOutOfBusinessHours = () => {
    const {
      businessHoursViewState: {offlineBehaviour}
    } = store.getState();

    // Return true IF
    // it is out of business hours AND
    // the offline behavior selected is `hide_widget`
    return isOutOfBusinessHours() && offlineBehaviour === OFFLINE_BEHAVIOUR.HIDE_WIDGET;
  };

  /**
   * Return end user first message.
   * @returns {Object} - end user first message
   */
  const getEndUserFirstMessage = () => {
    const {chatView, entities} = store.getState();
    const {endUserFirstMsgId} = chatView;
    let message = null;

    for (const id in entities.messages) {
      if (entities.messages.hasOwnProperty(id) && id === endUserFirstMsgId) {
        message = entities.messages[id];
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
      entities: {messages}
    } = store.getState();

    for (const msgId in messages) {
      if (messages.hasOwnProperty(msgId)) {
        const msg = messages[msgId];

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
    return (
      "hsft_anon_" +
      Date.now() +
      "-" +
      getUuid()
        .replace(/-/g, "")
        .substring(0, 15)
    );
  };

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
  const isEmailValid = (value) => EMAIL_REGEX.test(value);

  /**
   * Predicate to return whether date format is valid
   * Accepted date formats are
   * 1. "dd/mm/yyyy" (date input not supported)
   * 2. "yyyy-mm-dd" (date input supported)
   * @param {String} dateValue - value of date in string
   * @returns {Boolean} - date format is valid
   */
  const _isDateFormatValid = (dateValue) => {
    let formatRegEx = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

    if (isDateInputSupported()) {
      formatRegEx = /^\d{4}-\d{1,2}-\d{1,2}$/;
    }

    return formatRegEx.test(dateValue);
  };

  /**
   * Returns individual date parts config object - day, month and year
   * @param {String} dateValue - value of date in string
   * @returns {Object} - object containing date parts
   */
  const _getDateParts = (dateValue) => {
    let parts = "";
    let day = "";
    let month = "";
    let year = "";

    // If input type="date" is supported by the browser then the format will
    // always be "yyyy-mm-dd", else we are accepting date from user in textfield
    // in "dd/mm/yyy" format.
    // Ref :- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date

    if (isDateInputSupported()) {
      parts = dateValue.split("-");
      day = parseInt(parts[2], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[0], 10);
    } else {
      parts = dateValue.split("/");
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    }

    return {
      day,
      month,
      year
    };
  };

  /**
   * Predicate to return whether given value is valid date
   * @param {String} val - date value
   * @returns {Boolean} - date is valid
   */
  const isDateValid = (val) => {
    const dateFormatIsValid = _isDateFormatValid(val);

    if (!dateFormatIsValid) {
      return false;
    }

    const {day, month, year} = _getDateParts(val);

    // Check the ranges of month and year
    if (year < 1000 || year > 3000 || month === 0 || month > 12) {
      return false;
    }

    const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Adjust for leap years
    if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) {
      monthLength[1] = 29;
    }

    // Check the range of the day
    return day > 0 && day <= monthLength[month - 1];
  };

  /**
   * Validate userId (passed with `helpshiftConfig`).
   * A valid userId
   * should be <= 750 characters
   * should not contain leading or trailing spaces
   * @param {string} value - userId to validate.
   * @returns {boolean} - true if the userId is valid.
   */
  const isUserIdValid = (value) => {
    return !!(value && value.length <= 750 && value === value.trim());
  };

  /**
   * Predicate to return whether issue is created and not preIssue
   * @param {Object} config
   * @returns {Boolean} - whether issue is created
   */
  const isIssueCreated = (config) => {
    const {activeIssueId, issueType} = config;
    return !!activeIssueId && issueType !== ISSUE_TYPE.PRE_ISSUE;
  };

  /**
   * Get the message id of the backend bot step message that returns the FAQ
   * suggestion with the Answer Bot.
   * @returns {string}
   */
  const getFaqSuggestionMessageId = () => {
    const faqMessage = arrayUtils.findObjectByKey(
      store.getState().chatView.messageList,
      MESSAGE_TYPE.FAQ_LIST_WITH_OPTION_INPUT,
      "type"
    );

    if (faqMessage) {
      return faqMessage.id;
    }

    return "";
  };

  /**
   * Returns whether current browser supports input of type date
   */
  // @TODO - Move this function to gunpowder
  const isDateInputSupported = () => {
    // In order to avoid creating DOM element each time this function is called,
    // we are using computed value
    return DOES_BROWSER_SUPPORT_DATE_INPUT;
  };

  /**
   * Returns date object for given date string
   * @param {String} value - User entered date in either "dd/mm/yyyy" or
   *                         "yyyy-mm-dd" format
   * @returns {Date} - Date
   */
  const getDateObjectFromString = (value) => {
    if (!_isDateFormatValid(value)) {
      return null;
    }

    const {day, month, year} = _getDateParts(value);
    /**
     * MDN :- Month Index is Integer value representing the month, beginning
     * with 0 for January to 11 for December.
     */
    return new Date(year, month - 1, day);
  };

  /**
   * Validates a number which can contain '.'
   * @param {String} value - number to validate
   * @returns {Boolean} - whether number is valid
   */
  // @TODO - Move this function to gunpowder
  const isNumberValid = (value) => {
    return NUMBER_WITH_DECIMAL_REG_EX.test(value);
  };

  /*
   * Predicate for checking if user has seen messages or not.
   * If the window is in focus & chat view is active,
   * Web Chat is not in minimized state, and the user is not
   * viewing past messages that means the user has seen the messages.
   * @returns {Boolean}
   */
  const areMessagesSeen = () => {
    const {
      appState: {minimized, activeView, windowIsFocused},
      chatView: {userIsViewingPastMessages, unreadMessageIds}
    } = store.getState();

    return (
      !!unreadMessageIds.length &&
      windowIsFocused &&
      !minimized &&
      ACTIVE_VIEW.CHAT === activeView &&
      !userIsViewingPastMessages
    );
  };

  /**
   * Returns unique selector of element
   * Ref - https://stackoverflow.com/questions/5706837/get-unique-selector-of-element-in-jquery
   * Added extra attribute to define target parent
   *
   * @param {Object} elem - Element data object
   * @param {Object} targerParent - Element of target parent
   * @returns {String} - unique selector of element
   */
  const getSelectorForElement = (elem, targerParent) => {
    let path;

    while (elem) {
      let subSelector = elem.localName;
      if (!subSelector) {
        break;
      }
      subSelector = subSelector.toLowerCase();

      const parent = elem.parentElement;

      if (parent) {
        const sameTagSiblings = parent.children;
        if (sameTagSiblings.length > 1) {
          let nameCount = 0;
          const index =
            arrayUtils.findIndex(Array.prototype.slice.call(sameTagSiblings, 0), (child) => {
              if (elem.localName === child.localName) {
                nameCount++;
              }
              return child === elem;
            }) + 1;

          if (index > 1 && nameCount > 1) {
            subSelector += ":nth-child(" + index + ")";
          }
        }
      }

      path = subSelector + (path ? " " + path : "");

      // Stop adding parents selectors after reaching the target parent
      if (targerParent && parent === targerParent) {
        break;
      }
      elem = parent;
    }
    return path;
  };

  /**
   * Generates the key used for storing in localstorage whether faq suggestion via custom bot
   * was read
   * @param {string} msgId - Id of the faq suggestion msg
   * @returns {string} - Key used for storing in localstorage whether faq suggestion was read
   */
  const getCbFaqSuggestionReadLsKey = (msgId) => {
    return `${msgId}_cb_fsr`;
  };

  /**
   * Returns the concatenation of the identifiers
   * @param {String} userId - Current user Id
   * @param {number} phoneNumber - Current user phone number
   * @param {String} userEmail - Current user email
   * @param {String} anonUserIdentifier - Current user id
   * @returns {String} - A unique identifier
   */
  const getUniqueUserIdentifier = ({userId, phoneNumber, userEmail, anonUserIdentifier}) => {
    // @TODO : COGS Optimization - Generate identifier by using hashing technique.
    // Ex - MD5 hash, SHA256 etc
    let identifier = "";

    if (!userId && !phoneNumber && !userEmail) {
      return anonUserIdentifier;
    }

    if (userId) {
      identifier += userId;
    }
    if (phoneNumber) {
      identifier += phoneNumber;
    }
    if (userEmail) {
      identifier += userEmail;
    }

    return identifier;
  };

  return {
    isOutOfBusinessHours,
    isWidgetHiddenOutOfBusinessHours,
    getEndUserFirstMessage,
    getSuggestedFaqs,
    getAnonUserId,
    isEmailValid,
    isDateValid,
    isUserIdValid,
    isIssueCreated,
    getFaqSuggestionMessageId,
    isDateInputSupported,
    getDateObjectFromString,
    isNumberValid,
    areMessagesSeen,
    getSelectorForElement,
    getCbFaqSuggestionReadLsKey,
    getUniqueUserIdentifier
  };
});
