/**
 * Helpers for analytics (event tracking, etc).
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 29 Nov, 2017
 */

define("helpers/analytics", [
  "constants/analytics",
  "constants/routes",
  "constants/appState",
  "constants/businessHoursView",
  "constants/message",
  "constants/chatView",
  "store",
  "helpers/xhr",
  "helpers/common",
  "helpers/localStorage",
  "gunpowder/utils/xhr",
  "gunpowder/utils/object",
  "gunpowder/utils/array",
  "utils/browser",
  "actions/actionCreators"
], function(
  analyticsConstants,
  routes,
  appStateConstants,
  businessHoursConstants,
  msgConstants,
  chatViewConstants,
  store,
  xhrHelpers,
  commonHelpers,
  lsHelpers,
  xhr,
  objUtils,
  arrayUtils,
  browserUtils,
  actionCreators
) {
  "use strict";

  const {ISSUE_TYPE, ISSUE_STATE} = appStateConstants;
  const {INTENTS_SEARCH_ALGO} = chatViewConstants;
  const {OFFLINE_BEHAVIOUR} = businessHoursConstants;

  const {EVENT, PAYLOAD_EVENT, TRIGGER, PAYLOAD_SOURCE, BATCH_EVENTS_TIMEOUT} = analyticsConstants;

  const {FAQ_SUGGESTION_SOURCES} = msgConstants;

  let _route;
  const _isBot = browserUtils.isBot();
  const _lang = browserUtils.getLanguage();

  /**
   * Determine whether a backend issue exists in the system.
   * @returns {boolean}
   */
  const _doesIssueExist = () => {
    const {
      businessHoursViewState: bhState,
      appState: {issueState, issueType, internalIssueId}
    } = store.getState();

    const outOfBusinessHours = commonHelpers.isOutOfBusinessHours();

    // An issue exists
    // If it's out of business hours and
    //    offline behavior is `contact_form` and
    //    contact form has been submitted
    // Or
    // If it's in business hours and
    //    there's an active issue
    //    there's an active issue id in the system, which will be passed to the event.
    if (outOfBusinessHours) {
      return (
        bhState.offlineBehaviour === OFFLINE_BEHAVIOUR.CONTACT_FORM && bhState.contactFormSubmitted
      );
    } else {
      return (
        issueType === ISSUE_TYPE.ISSUE && issueState === ISSUE_STATE.ACTIVE && !!internalIssueId
      );
    }
  };

  /**
   * Get the XHR route for tracking analytics events.
   * Also, cache the value in a local variable because it remains the same.
   */
  const _getRoute = () => {
    const {domain} = store.getState().appState;
    _route = routes.postAnalyticsEvent(domain);
    return _route;
  };

  /**
   * Get the event XHR payload that needs to be passed along with all the calls.
   */
  const _getDefaultPayload = () => {
    const {
      appState: {deviceId, developerSetLanguage}
    } = store.getState();

    // @TODO: Backend needs `cc` (country code) as well, but we don't have this
    // information. Add it to the following object when we implement it.
    const payload = {
      [PAYLOAD_EVENT.ID]: deviceId,
      [PAYLOAD_EVENT.TIMESTAMP]: Date.now(), // Timestamp of when the event is tracked
      [PAYLOAD_EVENT.LANGUAGE]: _lang
    };

    if (developerSetLanguage) {
      payload[PAYLOAD_EVENT.DEV_SET_LANGUAGE] = developerSetLanguage;
    }

    return xhrHelpers.getPreparedXhrData(payload);
  };

  /**
   * Returns the analytics session id
   * @returns {String} - Analytics session id
   */
  const _getAnalyticsSessionId = () => {
    return store.getState().appState.analytics.sessionId;
  };

  let eventQueue = [];
  let eventFlushTimer = null;

  /**
   * Track given event
   * @param {Object} eventPayload - Event payload with name, event timestamp etc.
   */
  const _trackEvent = (eventPayload) => {
    // If there is no timer to flush the event queue, fire the XHR for current event,
    // otherwise push the event to the event queue, and flush events after the
    // timeout gets completed.
    if (!eventFlushTimer) {
      _fireTrackingXhr([eventPayload]);

      eventFlushTimer = window.setTimeout(() => {
        if (eventQueue.length) {
          _fireTrackingXhr(eventQueue);
          eventQueue = [];
        }

        eventFlushTimer = null;
      }, BATCH_EVENTS_TIMEOUT);
    } else {
      eventQueue.push(eventPayload);
    }
  };

  /**
   * Fire the XHR to track the given events payload.
   * @param {Object[]} eventsPayload - Array of events payload with name, event timestamp etc.
   */
  const _fireTrackingXhr = (eventsPayload) => {
    const defaultPayload = _getDefaultPayload();
    const data = objUtils.shallowMerge(defaultPayload, {
      e: JSON.stringify(eventsPayload)
    });

    xhr({
      route: _route || _getRoute(),
      headers: xhrHelpers.getCommonHeaders(),
      data,
      method: "POST"
    });
  };

  /**
   * Track the widget load event.
   * @param {Number} ts - unix epoch
   */
  const _trackWidgetLoad = (ts) => {
    _trackEvent({
      ts,
      t: PAYLOAD_EVENT.WIDGET_LOAD,
      d: {
        acid: _getAnalyticsSessionId()
      }
    });
  };

  /**
   * Track the widget open event.
   * @param {Object} [config]
   * @param {string} [config.trigger] - whether the widget was opened via an API
   *    call or a user action.
   * @param {Number} [config.ts] - unix epoch
   */
  const _trackWidgetOpen = (config = {}) => {
    const {
      appState: {internalIssueId, issueType, reEngagementId}
    } = store.getState();

    const outOfBusinessHours = commonHelpers.isOutOfBusinessHours() ? 0 : 1;

    const eventData = {
      ts: config.ts,
      d: {
        acid: _getAnalyticsSessionId(),
        s: config.trigger === TRIGGER.API ? PAYLOAD_SOURCE.API : PAYLOAD_SOURCE.USER,
        b: outOfBusinessHours
      }
    };

    if (reEngagementId) {
      eventData.engagement_id = reEngagementId;
    }

    // If issue exists — send issueId with `id` and type `c` with `t`.
    // If issue doesn’t exist — send preIssueId with `preissue_id` and type `i` with `t`.
    if (_doesIssueExist()) {
      eventData.d.id = internalIssueId;
      eventData.t = PAYLOAD_EVENT.WIDGET_OPEN_WITH_ISSUE;
    } else {
      if (issueType === ISSUE_TYPE.PRE_ISSUE) {
        eventData.d.preissue_id = internalIssueId;
      }
      eventData.t = PAYLOAD_EVENT.WIDGET_OPEN_WITHOUT_ISSUE;
    }

    _trackEvent(eventData);
  };

  /**
   * Track the issue created event. This event is tracked only when the issue
   * creation succeeds.
   * @param {string} [config.issueId] - issueId of the created issue
   * @param {Number} [config.ts] - unix epoch
   */
  const _trackIssueCreated = (config = {}) => {
    _trackEvent({
      ts: config.ts,
      d: {
        acid: _getAnalyticsSessionId(),
        id: config.issueId
      },
      t: PAYLOAD_EVENT.ISSUE_CREATED
    });
  };

  /**
   * Track suggested FAQ read event.
   * This event's data is sent to backend which then passes it to data platform.
   * This is done so because data platform requires all the conversation
   * related events in one stream. Backend tracks other conversational events
   * because preissue/issue business logic is handled by backend.
   * @param {Object} [config]
   * @param {string} [config.msgId] - Id of msg which had faq suggestions
   * @param {string} [config.faqSource] - FAQ source
   */
  const _trackSuggestedFaqRead = (config = {}) => {
    const {
      appState: {domain, internalIssueId, issueType},
      faqView: {
        activeFaq: {id: faqId}
      }
    } = store.getState();

    // @TODO: Backend doesn't send publish id with the GET faq API. Get the
    // publish_id in order to send it with this xhr.
    const xhrData = {
      faq_id: faqId
    };

    if (issueType === ISSUE_TYPE.ISSUE) {
      xhrData.issue_id = internalIssueId;
      xhrData.message_id = config.msgId;
    } else {
      xhrData.preissue_id = internalIssueId;
      xhrData.message_id = commonHelpers.getFaqSuggestionMessageId();
    }

    xhr({
      route: routes.postSuggestedFaqRead(domain),
      headers: xhrHelpers.getCommonHeaders(),
      data: xhrHelpers.getPreparedXhrData(xhrData, {
        skipPlatformId: true
      }),
      method: "POST",
      onSuccess: () => {
        // Store the fact that the SUGGESTED_FAQ_READ event has been tracked once
        if (config.faqSource === FAQ_SUGGESTION_SOURCES.CUSTOM_BOT) {
          // @TODO: Create a separate action which will update the state and
          // it will also trigger the middleware for localstorage value to be
          // set by the udpated value in state. For now, in case of custom
          // bots we are not storing the faq suggestion read flag in state, we
          // are directly using localstorage.
          lsHelpers.set(commonHelpers.getCbFaqSuggestionReadLsKey(config.msgId), true);
        } else {
          store.dispatch(actionCreators.setSuggestedFaqReadTracked(true));
        }
      }
    });
  };

  /**
   * Track CSAT events. The following events are tracked.
   * 1. CSAT requested
   * 2. Taking CSAT survey
   * 3. CSAT submitted
   * @param {Object} config
   * @param {string} config.event - The CSAT event to track
   * @param {Number} config.ts - unix epoch
   */
  const _trackCsatEvents = ({event, ts}) => {
    const {
      appState: {internalIssueId}
    } = store.getState();

    const eventData = {
      ts,
      d: {
        acid: _getAnalyticsSessionId(),
        id: internalIssueId
      }
    };

    switch (event) {
      case EVENT.CSAT_REQUESTED:
        eventData.t = PAYLOAD_EVENT.CSAT_REQUESTED;
        break;
      case EVENT.CSAT_TAKING_SURVEY:
        eventData.t = PAYLOAD_EVENT.CSAT_TAKING_SURVEY;
        break;
      case EVENT.CSAT_SURVEY_SUBMITTED:
        eventData.t = PAYLOAD_EVENT.CSAT_SURVEY_SUBMITTED;
        break;
    }

    _trackEvent(eventData);
  };

  /**
   * Track selected intent event.
   * When the end user selects any level intent.
   *
   * @param {Object} config
   * @param {Object} config.intent - The selected intent
   * @param {Number} config.ts - unix epoch
   */
  const _trackIntentSelected = (config) => {
    const {intent, ts} = config;
    const {
      chatView: {
        intents: {selectedIntentIds, isSearching, searchResultIntents}
      }
    } = store.getState();

    const data = {
      acid: _getAnalyticsSessionId(),
      iids: selectedIntentIds,
      leaf: !(intent.children && intent.children.length)
    };

    // If intent was selected from search results, also pass its confidence value and rank
    if (isSearching) {
      const searchIndex = arrayUtils.findIndexByKey(searchResultIntents, intent.id, "intentId");

      if (searchIndex !== -1) {
        const {probability} = searchResultIntents[searchIndex];
        data.r = searchIndex + 1; // Rank starts from 1

        if (probability) {
          data.cnf = probability;
        }
      }
    }

    _trackEvent({
      t: PAYLOAD_EVENT.INTENT_SELECTED,
      ts,
      d: data
    });
  };

  /**
   * Track unselected intent event.
   * When the end user clicks on the back button after intent selection.
   *
   * @param {Object} config
   * @param {Number} config.ts - unix epoch
   */
  const _trackIntentUnselected = (config) => {
    const {
      chatView: {
        intents: {selectedIntentIds}
      }
    } = store.getState();

    _trackEvent({
      t: PAYLOAD_EVENT.INTENT_UNSELECTED,
      ts: config.ts,
      d: {
        acid: _getAnalyticsSessionId(),
        iids: selectedIntentIds
      }
    });
  };

  /**
   * Track search intent event.
   * This event is triggered when the end user performs a search on the intent tree.
   * Triggers for this event are:
   * (1) Clearing the entire input field.
   * (2) Selecting an intent from search results.
   * (3) Sending the message.
   *
   * @param {Object} config
   * @param {Boolean} config.searchIsCleared - True if the search is cleared
   * @param {Number} config.ts - unix epoch
   */
  const _trackSearchIntent = (config) => {
    const {
      chatView: {
        intents: {searchResultIntents, searchAlgo, model, searchLevel}
      }
    } = store.getState();
    const {ts, searchIsCleared = false} = config;

    const data = {
      acid: _getAnalyticsSessionId(),
      rc: searchResultIntents.length,
      clr: searchIsCleared
    };

    // Add `l`, `sa`, and `mv` fields to data
    // When search is performed `l` indicates the level of the search result.
    // Since substring matching always produces leaf level nodes this will be 2.
    // In case of AI algorithm this can be either 1 or 2 depending on whether the root node was
    // returned or leaf node was returned as a match.
    // `sa` indicates the search algorithm.
    // `mv` indicates the model version when the search algorithm is ML based.
    data.l = searchLevel;

    if (searchAlgo === INTENTS_SEARCH_ALGO.SUBSTRING) {
      data.sa = "ss";
    } else if (searchAlgo === INTENTS_SEARCH_ALGO.ML) {
      data.sa = "ml";
      data.mv = model.version;
    }

    _trackEvent({
      t: PAYLOAD_EVENT.SEARCH_INTENTS,
      ts,
      d: data
    });
  };

  /**
   * Triggered when intent tree is shown to the end user.
   * @param {Object} config
   * @param {Number} config.ts - unix epoch
   */
  const _trackIntentTreeShown = (config) => {
    const {
      chatView: {
        intents: {tree, enforceIntentSelection}
      }
    } = store.getState();

    _trackEvent({
      t: PAYLOAD_EVENT.INTENT_TREE_SHOWN,
      ts: config.ts,
      d: {
        acid: _getAnalyticsSessionId(),
        itid: tree.id,
        itv: tree.version,
        eis: enforceIntentSelection
      }
    });
  };

  /**
   * Triggered any time the message is sent by the end user.
   * This will also be triggered when the end user finishes the intent selection.
   * @param {Object} config
   * @param {Object} config.message
   * @param {String} config.message.id - Message id
   * @param {String} config.message.type - Message type
   * @param {Number} config.ts - unix epoch
   */
  const _trackMessageSent = (config) => {
    const {
      message: {id, type},
      ts
    } = config;

    _trackEvent({
      t: PAYLOAD_EVENT.MESSAGE_SENT,
      ts: ts,
      d: {
        acid: _getAnalyticsSessionId(),
        id,
        type
      }
    });
  };

  /**
   * Track a message action click event. This event is trigerred when an action in an action card
   * in a message is clicked. In the first version of messages with actions, we support link and
   * call types of action.
   * @param {Object} eventData
   * @param {string} eventData.issueId
   * @param {string} eventData.messageId
   * @param {string} eventData.actionId
   * @param {string} eventData.actionType
   */
  const _trackMessageActionClicked = ({issueId, messageId, actionId, actionType}) => {
    _trackEvent({
      t: PAYLOAD_EVENT.MESSAGE_ACTION_CLICKED,
      ts: Date.now(),
      d: {
        issue_id: issueId,
        type: actionType,
        a: actionId,
        mid: messageId
      }
    });
  };

  /**
   * Track feature expiry event. This event is triggered when:
   * 1) User loads an resolved issue or takes some action on the resolution
   * question after it has been expired.
   *
   * @param {Object} eventData
   * @param {string} eventData.issueId - Active issue id
   * @param {string} eventData.feature - Feature that has been expired
   */
  const _trackFeatureExpiry = ({issueId, feature}) => {
    _trackEvent({
      t: PAYLOAD_EVENT.FEATURE_EXPIRY,
      ts: Date.now(),
      d: {
        type: feature,
        id: issueId
      }
    });
  };

  /**
   * Track the given event with relevant data.
   * @param {string} event - The event to track.
   * @param {Object} [config]
   * @param {Number} [config.ts] - Unix epoch
   * @param {string} [config.msgId] - Id of msg which had faq suggestions
   * @param {string} [config.faqSource] - FAQ source
   */
  const track = (event, config = {}) => {
    // Do not track the event if initiated via a search engine bot or crawler.
    if (_isBot) {
      return;
    }

    config.ts = config.ts || Date.now();

    // Handle events considering state is ready now.
    switch (event) {
      case EVENT.WIDGET_LOAD:
        _trackWidgetLoad(config.ts);
        break;
      case EVENT.WIDGET_OPEN:
        _trackWidgetOpen(config);
        break;
      case EVENT.ISSUE_CREATED:
        _trackIssueCreated(config);
        break;
      case EVENT.SUGGESTED_FAQ_READ:
        _trackSuggestedFaqRead(config);
        break;
      case EVENT.CSAT:
        _trackCsatEvents(config);
        break;
      case EVENT.INTENT_SELECTED:
        _trackIntentSelected(config);
        break;
      case EVENT.INTENT_UNSELECTED:
        _trackIntentUnselected(config);
        break;
      case EVENT.SEARCH_INTENTS:
        _trackSearchIntent(config);
        break;
      case EVENT.INTENT_TREE_SHOWN:
        _trackIntentTreeShown(config);
        break;
      case EVENT.MESSAGE_SENT:
        _trackMessageSent(config);
        break;
      case EVENT.MESSAGE_ACTION_CLICKED:
        _trackMessageActionClicked(config);
        break;
      case EVENT.FEATURE_EXPIRY:
        _trackFeatureExpiry(config);
        break;
    }
  };

  return {
    track
  };
});
