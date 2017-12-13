/**
 * Common action creators.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 16, 2017
 */

define ("actions/actionCreators",
  [
    "constants/actionTypes"
  ],
  function (ACTION_TYPES) {
    "use strict";

    /**
     * Return action to update the active view
     * @param {String} view - update the active view to
     * @returns {Object} - the action object
     */
    const updateActiveView = (view) => ({
      type: ACTION_TYPES.UPDATE_ACTIVE_VIEW,
      view
    });

    /**
     * Return action to set user profile id.
     * @param {String} profileId - user profile id
     * @returns {Object} - the action object
     */
    const setUserProfileId = (profileId) => ({
      type: ACTION_TYPES.SET_USER_PROFILE_ID,
      profileId
    });

    /**
     * Return action to toggle agent typing
     * @param {Boolean} typing
     * @returns {Object} - the action object
     */
    const toggleAgentTyping = (typing) => ({
      type: ACTION_TYPES.TOGGLE_AGENT_TYPING,
      typing
    });

    /**
     * Return action to set mobile info
     * @param {Boolean} browserIsMobile
     * @returns {Object} - the action object
     */
    const setMobileInfo = (browserIsMobile) => ({
      type: ACTION_TYPES.SET_MOBILE_INFO,
      browserIsMobile
    });

    /**
     * Return action to reset state
     * @returns {Object} - the action object
     */
    const reset = () => ({
      type: ACTION_TYPES.RESET
    });

    /**
     * Return the action to set the greeting message string
     * @param {string} message - the greeting message to set
     * @returns {Object} - the action object
     */
    const setGreetingMsg = (message) => ({
      type: ACTION_TYPES.SET_GREETING_MESSAGE,
      message
    });

    /**
     * Return the action to set CIF
     * @param {Object} cif - the CIF object to set
     * @returns {Object} - the action object
     */
    const setCif = (cif) => ({
      type: ACTION_TYPES.SET_CIF,
      cif
    });

    /**
     * Return the action to set tags
     * @param {array} tags - the tags list to set
     * @returns {Object} - the action object
     */
    const setTags = (tags) => ({
      type: ACTION_TYPES.SET_TAGS,
      tags
    });

    /**
     * Return the action to set prechat feature index
     * @param {number} index - the prechat feature index to set
     * @returns {Object} - the action object
     */
    const setPreChatFeatureIndex = (index) => {
      return {
        type: ACTION_TYPES.SET_PRE_CHAT_FEATURE_INDEX,
        preChatFeatureIndex: index
      };
    };

    /**
     * Return the action to set executeGreetingMessage in app state
     * @param {boolean} executeGreetingMessagex - set the value to true or false
     * @returns {Object} - the action object
     */
    const setExecuteGreetingMessage = (executeGreetingMessage) => {
      return {
        type: ACTION_TYPES.SET_EXECUTE_GREETING_MESSAGE,
        executeGreetingMessage
      };
    };

    /**
     * Return the action to set if the suggested FAQ read event has been tracked.
     * @param {boolean} isTracked
     * @returns {Object}
     */
    const setSuggestedFaqReadTracked = (isTracked) => {
      return {
        type: ACTION_TYPES.SET_SUGGESTED_FAQ_READ_TRACKED,
        isTracked
      };
    };

    /**
     * Return the action to set the conversation ID in the store. Conversation IDs
     * are used only with analytics event tracking.
     * @param {string} cid - The conversation ID, a random UUID string
     * @returns {Object}
     */
    const setConversationId = (cid) => {
      return {
        type: ACTION_TYPES.SET_CONVERSATION_ID,
        cid
      };
    };

    /**
     * Return the action to update the read FAQs list in the store.
     * @param {string} faqId
     * @returns {Object}
     */
    const updateReadFaqList = (faqId) => {
      return {
        type: ACTION_TYPES.UPDATE_READ_FAQ_LIST,
        faqId
      };
    };

    /**
     * Return the action to set the internal issue ID in the store. Internal issue
     * ID is the long issue ID of the formal domain_issue_randomstring
     * @param {string} id
     * @returns {Object}
     */
    const setInternalIssueId = (id) => {
      return {
        type: ACTION_TYPES.SET_INTERNAL_ISSUE_ID,
        id
      };
    };

    return {
      updateActiveView,
      setUserProfileId,
      toggleAgentTyping,
      setMobileInfo,
      reset,
      setGreetingMsg,
      setCif,
      setTags,
      setPreChatFeatureIndex,
      setExecuteGreetingMessage,
      setSuggestedFaqReadTracked,
      setConversationId,
      updateReadFaqList,
      setInternalIssueId
    };
  });
