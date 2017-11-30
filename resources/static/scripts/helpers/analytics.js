/**
 * Helpers for analytics (event tracking, etc).
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 29 Nov, 2017
 */

define ("helpers/analytics",
  [
    "constants/analytics",
    "constants/routes",
    "store",
    "helpers/xhr",
    "gunpowder/utils/xhr",
    "gunpowder/utils/object"
  ],
  function (analyticsConstants, routes, store, xhrHelpers, xhr, objUtils) {
    "use strict";

    const {EVENT} = analyticsConstants;
    let _route;

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
     * Track the given event with relevant data.
     * @param {string} event - The event to track.
     */
    const track = (event) => {
      switch (event) {
        case EVENT.WIDGET_LOAD:
          _trackWidgetLoad ();
          break;
      }
    };

    return {
      track
    };
  });
