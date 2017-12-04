/**
 * Helpers for analytics (event tracking, etc).
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 29 Nov, 2017
 */

define ("helpers/analytics",
  [
    "constants/analytics",
    "constants/routes",
    "constants/appState",
    "constants/businessHoursView",
    "store",
    "helpers/xhr",
    "helpers/localStorage",
    "helpers/common",
    "gunpowder/utils/xhr",
    "gunpowder/utils/object"
  ],
  function (analyticsConstants, routes, APP_STATE_CONSTANTS, BUSINESS_HOURS_CONSTANTS,
    store, xhrHelpers, lsHelpers, commonHelpers, xhr, objUtils) {
    "use strict";

    const {
      ISSUE_STATE
    } = APP_STATE_CONSTANTS;
    const {
      OFFLINE_BEHAVIOUR
    } = BUSINESS_HOURS_CONSTANTS;
    const {EVENT, SOURCE} = analyticsConstants;
    let _route;

    /**
     * Determine whether a backend issue exists in the system.
     * @returns {boolean}
     */
    const _doesIssueExist = () => {
      const {
        businessHoursViewState: bhState
      } = store.getState ();

      const outOfBusinessHours = commonHelpers.isOutOfBusinessHours ();

      // Read the issue state from localstorage to get this information on page
      // reloads before the state is re-hydrated.
      const issueState = lsHelpers.getIssueState ();

      // An issue exists
      // If it's out of business hours and
      //    offline behavior is `contact_form` and
      //    contact form has been submitted
      // Or
      // If it's in business hours and
      //    there's an active issue
      if (outOfBusinessHours) {
        return (
          bhState.offlineBehaviour === OFFLINE_BEHAVIOUR.CONTACT_FORM &&
          bhState.contactFormSubmitted
        );
      } else {
        return issueState === ISSUE_STATE.ACTIVE;
      }
    };

    /**
     * Get the XHR route for tracking analytics events.
     * Also, cache the value in a local variable because it remains the same.
     */
    const _getRoute = () => {
      const {domain} = store.getState ().appState;
      _route = routes.postAnalyticsEvent (domain);
      return _route;
    };

    /**
     * Get the event XHR payload that needs to be passed along with all the calls.
     */
    const _getDefaultPayload = () => {
      const {
        platformId,
        identifier,
        userId,
        userProfileId
      } = store.getState ().appState;

      // @TODO: Add `ln` (language) to the following object.
      // @TODO: Backend needs `cc` (country code) as well, but we don't have this
      // information. Add it to the following object when we implement it.
      const payload = {
        "platform-id": platformId,
        "id": identifier,
        "did": identifier, // Device ID
        "timestamp": Date.now () // Timestamp of when the event is tracked (XHR fired)
      };

      if (userId) {
        payload.uid = userId;
      }

      if (userProfileId) {
        payload ["profile-id"] = userProfileId;
      }

      return payload;
    };

    /**
     * Fire the XHR to track the given event payload.
     * @param {Object} payload - The event payload with name, event timestamp etc.
     */
    const _fireTrackingXhr = (payload) => {
      const defaultPayload = _getDefaultPayload ();
      const data = objUtils.shallowMerge (defaultPayload, payload);

      xhr ({
        route: _route || _getRoute (),
        headers: xhrHelpers.getCommonHeaders (),
        data,
        method: "POST"
      });
    };

    /**
     * Track the widget load event.
     */
    const _trackWidgetLoad = () => {
      const eventPayload = {
        e: JSON.stringify ([{
          ts: Date.now (),
          t: "a"
        }])
      };

      _fireTrackingXhr (eventPayload);
    };

    /**
     * Track the widget open event.
     * @param {Object} [config]
     * @param {string} [config.source] - whether the widget was opened via an API
     *    call or a user action.
     */
    const _trackWidgetOpen = (config = {}) => {
      const outOfBusinessHours = commonHelpers.isOutOfBusinessHours () ? 1 : 0;

      // Track `c` is an issue exists, `i`, if it doesn't.
      const issueExists = _doesIssueExist ();

      // @TODO: Send the long issue ID (with `id`) when the API starts sending
      // it with create issue API response.
      const eventPayload = {
        e: JSON.stringify ([{
          ts: Date.now (),
          d: {
            // @TODO: Move the event strings to the constant file.
            s: config.source === SOURCE.API ? "js" : "u",
            b: outOfBusinessHours
          },
          t: issueExists ? "c" : "i"
        }])
      };

      _fireTrackingXhr (eventPayload);
    };

    /**
     * Track the conversation started event. This event is tracked when the end
     * user starts the conversation (e.g. submits the first reply).
     * @param {Object} [config]
     * @param {string} [config.source] - whether the end user's first message was
     *    set via an API call or a user action.
     */
    const _trackConversationStarted = (config = {}) => {
      const eventPayload = {
        e: JSON.stringify ([{
          ts: Date.now (),
          d: {
            s: config.source === SOURCE.API ? "js" : "u"
          },
          t: "cs"
        }])
      };

      _fireTrackingXhr (eventPayload);
    };

    /**
     * Track the issue created event. This event is tracked only when the issue
     * creation succeeds.
     */
    const _trackIssueCreated = () => {
      // @TODO: Send the long issue ID (with `d.id`) when the API starts sending
      // it with the create issue API response.
      const eventPayload = {
        e: JSON.stringify ([{
          ts: Date.now (),
          t: "p"
        }])
      };

      _fireTrackingXhr (eventPayload);
    };

    /**
     * Track the message added event.
     */
    const _trackMessageAdded = () => {
      // @TODO: Send the long issue ID (with `d.id`) when the API starts sending
      // it with the create issue API response.
      const eventPayload = {
        e: JSON.stringify ([{
          ts: Date.now (),
          t: "m"
        }])
      };

      _fireTrackingXhr (eventPayload);
    };

    /**
     * Track the given event with relevant data.
     * @param {string} event - The event to track.
     * @param {Object} [config]
     */
    const track = (event, config) => {
      switch (event) {
        case EVENT.WIDGET_LOAD:
          _trackWidgetLoad ();
          break;
        case EVENT.WIDGET_OPEN:
          _trackWidgetOpen (config);
          break;
        case EVENT.CONVERSATION_STARTED:
          _trackConversationStarted (config);
          break;
        case EVENT.ISSUE_CREATED:
          _trackIssueCreated ();
          break;
        case EVENT.MESSAGE_ADDED:
          _trackMessageAdded ();
          break;
      }
    };

    return {
      track
    };
  });
