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
  "store",
  "helpers/xhr",
  "helpers/common",
  "gunpowder/utils/xhr",
  "gunpowder/utils/object",
  "utils/browser",
  "actions/actionCreators"
], function(
  analyticsConstants,
  routes,
  appStateConstants,
  businessHoursConstants,
  store,
  xhrHelpers,
  commonHelpers,
  xhr,
  objUtils,
  browserUtils,
  actionCreators
) {
  "use strict";

  const {ISSUE_TYPE, ISSUE_STATE} = appStateConstants;

  const {OFFLINE_BEHAVIOUR} = businessHoursConstants;

  const {EVENT, PAYLOAD_EVENT, TRIGGER, PAYLOAD_SOURCE} = analyticsConstants;

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
      appState: {
        deviceId,
        developerSetLanguage,
        analytics: {sessionId: analyticsSessionId}
      }
    } = store.getState();

    // @TODO: Backend needs `cc` (country code) as well, but we don't have this
    // information. Add it to the following object when we implement it.
    const payload = {
      [PAYLOAD_EVENT.ID]: deviceId,
      [PAYLOAD_EVENT.SESSION_ID]: analyticsSessionId,
      [PAYLOAD_EVENT.TIMESTAMP]: Date.now(), // Timestamp of when the event is tracked
      [PAYLOAD_EVENT.LANGUAGE]: _lang
    };

    if (developerSetLanguage) {
      payload[PAYLOAD_EVENT.DEV_SET_LANGUAGE] = developerSetLanguage;
    }

    return xhrHelpers.getPreparedXhrData(payload);
  };

  /**
   * Fire the XHR to track the given event payload.
   * @param {Object} payload - The event payload with name, event timestamp etc.
   * @param {Object} [config]
   */
  const _fireTrackingXhr = (payload, config = {}) => {
    const defaultPayload = _getDefaultPayload();
    const data = objUtils.shallowMerge(defaultPayload, payload);

    xhr({
      route: _route || _getRoute(),
      headers: xhrHelpers.getCommonHeaders(),
      data,
      method: "POST",
      onSuccess: (response) => {
        if (typeof config.onSuccess === "function") {
          config.onSuccess(response);
        }
      }
    });
  };

  /**
   * Track the widget load event.
   * @param {Number} ts - unix epoch
   */
  const _trackWidgetLoad = (ts) => {
    const eventPayload = {
      e: JSON.stringify([
        {
          ts,
          t: PAYLOAD_EVENT.WIDGET_LOAD
        }
      ])
    };

    _fireTrackingXhr(eventPayload);
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

    const eventPayload = {
      e: JSON.stringify([eventData])
    };

    _fireTrackingXhr(eventPayload);
  };

  /**
   * Track the issue created event. This event is tracked only when the issue
   * creation succeeds.
   * @param {string} [config.issueId] - issueId of the created issue
   * @param {Number} [config.ts] - unix epoch
   */
  const _trackIssueCreated = (config = {}) => {
    const eventPayload = {
      e: JSON.stringify([
        {
          ts: config.ts,
          d: {
            id: config.issueId
          },
          t: PAYLOAD_EVENT.ISSUE_CREATED
        }
      ])
    };

    _fireTrackingXhr(eventPayload);
  };

  /**
   * Track suggested FAQ read event.
   * This event's data is sent to backend which then passes it to data platform.
   * This is done so because data platform requires all the conversation
   * related events in one stream. Backend tracks other conversational events
   * because preissue/issue business logic is handled by backend.
   */
  const _trackSuggestedFaqRead = () => {
    const {
      appState: {domain, internalIssueId},
      faqView: {
        activeFaq: {id: faqId}
      }
    } = store.getState();

    // @TODO: Backend doesn't send publish id with the GET faq API. Get the
    // publish_id in order to send it with this xhr.
    const xhrData = {
      preissue_id: internalIssueId,
      faq_id: faqId,
      message_id: commonHelpers.getFaqSuggestionMessageId()
    };

    xhr({
      route: routes.postSuggestedFaqRead(domain),
      headers: xhrHelpers.getCommonHeaders(),
      data: xhrHelpers.getPreparedXhrData(xhrData, {
        skipPlatformId: true
      }),
      method: "POST",
      onSuccess: () => {
        // Store the fact that the SUGGESTED_FAQ_READ event has been tracked once
        store.dispatch(actionCreators.setSuggestedFaqReadTracked(true));
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

    const eventPayload = {
      e: JSON.stringify([eventData])
    };

    _fireTrackingXhr(eventPayload);
  };

  /**
   * Track the given event with relevant data.
   * @param {string} event - The event to track.
   * @param {Object} [config]
   * @param {Number} [config.ts] - Unix epoch
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
        _trackSuggestedFaqRead();
        break;
      case EVENT.CSAT:
        _trackCsatEvents(config);
        break;
    }
  };

  return {
    track
  };
});
