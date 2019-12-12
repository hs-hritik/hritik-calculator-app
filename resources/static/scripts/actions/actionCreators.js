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
     * Return the action to set the developer language
     * @param {string} language - the language to be set
     * @returns {Object} - the action object
     */
    const setLanguage = (language) => ({
      type: ACTION_TYPES.SET_LANGUAGE,
      language
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
     * Return the action to set metadata
     * @param {Object} metadata - the metadata object to set
     * @returns {Object} - the action object
     */
    const setMetadata = (metadata) => {
      return {
        type: ACTION_TYPES.SET_METADATA,
        metadata
      };
    };


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

    /**
     * Action to set resolution question as completed
     * @param {Boolean} completed - whether resolution question is completed
     * @returns {Object} - Action
     */
    const setResolutionQuestionCompleted = (completed) => {
      return {
        type: ACTION_TYPES.SET_RESOLUTION_QUESTION_COMPLETED,
        completed
      };
    };

    /**
     * Action to set csat as completed
     * @returns {Object} - Action
     */
    const setCsatCompleted = () => {
      return {
        type: ACTION_TYPES.SET_CSAT_COMPLETED
      };
    };

    /**
     * Return the action to set the fullPrivacy flag in the state
     * @param {boolean} enabled
     * @returns {Object}
     */
    const setFullPrivacy = (enabled) => {
      return {
        type: ACTION_TYPES.SET_FULL_PRIVACY,
        enabled
      };
    };

    /**
     * Action to toggle loader
     * @param {Boolean} - loading
     * @returns {Object} - Action
     */
    const toggleChatViewLoading = (loading) => {
      return {
        type: ACTION_TYPES.TOGGLE_CHAT_VIEW_LOADING,
        loading
      };
    };

    /**
     * Action to toggle online status
     * @param {Boolean} online
     * @returns {Object} - Action
     */
    const toggleOnlineStatus = (online) => {
      return {
        type: ACTION_TYPES.TOGGLE_ONLINE_STATUS,
        online
      };
    };

    /**
     * Action to set footer active
     * @returns {Object} - Action
     */
    const setFooterActive = () => {
      return {
        type: ACTION_TYPES.SET_FOOTER_ACTIVE
      };
    };

    /**
     * Action to set footer inactive
     * @returns {Object} - Action
     */
    const setFooterInactive = () => {
      return {
        type: ACTION_TYPES.SET_FOOTER_INACTIVE
      };
    };

    /**
     * Action to reset re-engagement Id
     * @returns {Object} - Action
     */
    const resetReEngagementId = () => ({
      type: ACTION_TYPES.RESET_RE_ENGAGEMENT_ID
    });

    /**
     * Return action to change list picker toggle state
     * @param {String} toggleState - Whether the picker is in "closed", "opened" or
     * "resizing" state
     * @returns {Object} - the action object
     */
    const updateListPickerToggleState = (toggleState) => ({
      type: ACTION_TYPES.UPDATE_LIST_PICKER_TOGGLE_STATE,
      toggleState
    });

     /**
     * Action to set conversation ended
     * @returns {Object} - Action
     */
    const setConversationEnded = () => {
      return {
        type: ACTION_TYPES.SET_CONVERSATION_ENDED
      };
    };

    /**
     * Action to set app reset trigger
     * @param {String} value - value of reset trigger
     * @returns {Object} - Action
     */
    const setAppResetTrigger = (value) => {
      return {
        type: ACTION_TYPES.SET_APP_RESET_TRIGGER,
        value
      };
    };

    /**
     * Action to set initial user message in store
     * @param {String} - message
     * @returns {Object} - Action
     */
    const setInitialUserMsg = (message) => {
      return {
        type: ACTION_TYPES.SET_INITIAL_USER_MESSAGE,
        message
      };
    };

    /**
     * Action to set keyboard interaction is active/inactive flag in the state
     * @param {boolean} - active
     * @returns {Object} - Action
     */
    const setKeyboardInteractionIsActive = (active) => {
      return {
        type: ACTION_TYPES.SET_KEYBOARD_INTERACTION_IS_ACTIVE,
        active
      };
    };

    return {
      updateActiveView,
      toggleAgentTyping,
      setMobileInfo,
      reset,
      setGreetingMsg,
      setLanguage,
      setCif,
      setMetadata,
      setTags,
      setSuggestedFaqReadTracked,
      updateReadFaqList,
      setInternalIssueId,
      setResolutionQuestionCompleted,
      setCsatCompleted,
      setFullPrivacy,
      toggleChatViewLoading,
      toggleOnlineStatus,
      setFooterActive,
      setFooterInactive,
      resetReEngagementId,
      updateListPickerToggleState,
      setAppResetTrigger,
      setInitialUserMsg,
      setConversationEnded,
      setKeyboardInteractionIsActive
    };
  });
