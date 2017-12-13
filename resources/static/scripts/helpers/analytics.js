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
    "constants/chatView",
    "store",
    "helpers/xhr",
    "helpers/localStorage",
    "helpers/common",
    "gunpowder/utils/xhr",
    "gunpowder/utils/object",
    "utils/browser",
    "actions/actionCreators"
  ],
  function (analyticsConstants, routes, appStateConstants, businessHoursConstants,
    chatViewConstants, store, xhrHelpers, lsHelpers, commonHelpers, xhr, objUtils,
    browserUtils, actionCreators) {
    "use strict";

    const {
      ISSUE_STATE
    } = appStateConstants;

    const {
      OFFLINE_BEHAVIOUR
    } = businessHoursConstants;

    const {
      INFO_BOT_FIELDS
    } = chatViewConstants;

    const {
      EVENT,
      PAYLOAD_EVENT,
      SOURCE,
      PAYLOAD_SOURCE
    } = analyticsConstants;

    let _route;
    const _isBot = browserUtils.isBot ();

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
        appState: {
          platformId,
          identifier,
          userId,
          userProfileId
        },
        chatView: {
          conversationId
        }
      } = store.getState ();

      // @TODO: Add `ln` (language) to the following object.
      // @TODO: Backend needs `cc` (country code) as well, but we don't have this
      // information. Add it to the following object when we implement it.
      const payload = {
        [PAYLOAD_EVENT.PLAT_ID]: platformId,
        [PAYLOAD_EVENT.ID]: identifier,
        [PAYLOAD_EVENT.DEVICE_ID]: identifier, // Device ID
        [PAYLOAD_EVENT.TIMESTAMP]: Date.now () // Timestamp of when the event is tracked (XHR fired)
      };

      if (userId) {
        payload [PAYLOAD_EVENT.USER_ID] = userId;
      }

      if (userProfileId) {
        payload [PAYLOAD_EVENT.PROFILE_ID] = userProfileId;
      }

      if (conversationId) {
        payload [PAYLOAD_EVENT.CONVERSATION_ID] = conversationId;
      }

      return payload;
    };

    /**
     * Fire the XHR to track the given event payload.
     * @param {Object} payload - The event payload with name, event timestamp etc.
     * @param {Object} [config]
     */
    const _fireTrackingXhr = (payload, config = {}) => {
      const defaultPayload = _getDefaultPayload ();
      const data = objUtils.shallowMerge (defaultPayload, payload);

      xhr ({
        route: _route || _getRoute (),
        headers: xhrHelpers.getCommonHeaders (),
        data,
        method: "POST",
        onSuccess: (response) => {
          if (typeof config.onSuccess === "function") {
            config.onSuccess (response);
          }
        }
      });
    };

    /**
     * Track the widget load event.
     */
    const _trackWidgetLoad = () => {
      const eventPayload = {
        e: JSON.stringify ([{
          ts: Date.now (),
          t: PAYLOAD_EVENT.WIDGET_LOAD
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
            s: config.source === SOURCE.API ? PAYLOAD_SOURCE.API : PAYLOAD_SOURCE.USER,
            b: outOfBusinessHours
          },
          t: issueExists ?
            PAYLOAD_EVENT.WIDGET_OPEN_WITH_ISSUE :
            PAYLOAD_EVENT.WIDGET_OPEN_WITHOUT_ISSUE
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
            s: config.source === SOURCE.API ? PAYLOAD_SOURCE.API : PAYLOAD_SOURCE.USER
          },
          t: PAYLOAD_EVENT.CONVERSATION_STARTED
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
          t: PAYLOAD_EVENT.ISSUE_CREATED
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
          t: PAYLOAD_EVENT.MESSAGE_ADDED
        }])
      };

      _fireTrackingXhr (eventPayload);
    };

    /**
     * Track answer bot requested event.
     * @param {Object} config
     * @param {string} config.query - End user's query for the answer bot.
     */
    const _trackAnsBotRequested = ({query}) => {
      const eventPayload = {
        e: JSON.stringify ([{
          ts: Date.now (),
          d: {
            q: query
          },
          t: PAYLOAD_EVENT.ANS_BOT_REQUESTED
        }])
      };

      _fireTrackingXhr (eventPayload);
    };

    /**
     * Track answer bot result event.
     * @param {Object} config
     * @param {string} config.query - End user's query for the answer bot.
     * @param {array} config.faqIds - List of FAQ IDs in case of a successful get FAQ request.
     */
    const _trackAnsBotResult = ({query, faqIds}) => {
      const eventPayload = {
        e: JSON.stringify ([{
          ts: Date.now (),
          d: {
            q: query,
            ids: faqIds
          },
          t: PAYLOAD_EVENT.ANS_BOT_RESULT
        }])
      };

      _fireTrackingXhr (eventPayload);
    };

    /**
     * Track FAQ read events.
     * 1. Suggested FAQ Read (has to be tracked only once, even after page reloads)
     * 2. FAQ Read
     * @param {Object} config
     * @param {string} config.faqId - FAQ ID that was read.
     */
    const _trackFaqRead = ({faqId}) => {
      const {appState} = store.getState ();

      const eventData = [{
        ts: Date.now (),
        d: {
          id: faqId
        },
        t: PAYLOAD_EVENT.FAQ_READ
      }];

      if (!appState.analytics.suggestedFaqReadTracked) {
        eventData.push ({
          ts: Date.now (),
          t: PAYLOAD_EVENT.SUGGESTED_FAQ_READ
        });
      }

      const eventPayload = {
        e: JSON.stringify (eventData)
      };

      _fireTrackingXhr (eventPayload, {
        onSuccess: () => {
          // Store the fact that the SUGGESTED_FAQ_READ event has been tracked once
          store.dispatch (actionCreators.setSuggestedFaqReadTracked (true));
        }
      });
    };

    /**
     * Track issue deflection (successful and failed) events.
     * @param {Object} config
     * @param {boolean} config.deflected - Whether deflection succeeded or failed.
     */
    const _trackIssueDeflection = ({deflected}) => {
      const {readFaqList} = store.getState ().chatView;

      // Send a maximum of 10 latest items in the read FAQ list.
      const latestReadFaqList = readFaqList.slice (Math.max (readFaqList.length - 10, 0));
      const eventData = {
        ts: Date.now (),
        d: {
          q: commonHelpers.getEndUserFirstMessage ().body,
          ids: commonHelpers.getSuggestedFaqs ().map ((faq) => faq.id),
          rids: latestReadFaqList
        }
      };

      if (deflected) {
        eventData.t = PAYLOAD_EVENT.ISSUE_DEFLECTED;
      } else {
        eventData.t = PAYLOAD_EVENT.ISSUE_NOT_DEFLECTED;
      }

      const eventPayload = {
        e: JSON.stringify ([eventData])
      };

      _fireTrackingXhr (eventPayload);
    };

    /**
     * Track info bot requested event.
     */
    const _trackInfoBotRequested = () => {
      const eventPayload = {
        e: JSON.stringify ([{
          ts: Date.now (),
          t: PAYLOAD_EVENT.INFO_BOT_REQUESTED
        }])
      };

      _fireTrackingXhr (eventPayload);
    };

    /**
     * Track info bot field captured event. The following fields are supported.
     * Name.
     * Email.
     */
    const _trackInfoBotFieldCaptured = () => {
      const {
        chatView: {
          infoBot: {
            fieldsRequired,
            currentField,
            data: infoBotData
          }
        }
      } = store.getState ();

      const infoBotFieldCapturedEventData = {
        ts: Date.now ()
      };

      if (currentField === INFO_BOT_FIELDS.NAME) {
        infoBotFieldCapturedEventData.d = {
          p: infoBotData [INFO_BOT_FIELDS.NAME].prefilled ? 1 : 0
        };
        infoBotFieldCapturedEventData.t = PAYLOAD_EVENT.INFO_BOT_NAME_CAPTURED;
      } else {
        infoBotFieldCapturedEventData.d = {
          p: infoBotData [INFO_BOT_FIELDS.EMAIL].prefilled ? 1 : 0
        };
        infoBotFieldCapturedEventData.t = PAYLOAD_EVENT.INFO_BOT_EMAIL_CAPTURED;
      }

      // If all info bot fields are asked, track the info bot finished event as
      // well.
      let infoBotFinishedEventData;
      if (fieldsRequired.indexOf (currentField) === (fieldsRequired.length - 1)) {
        infoBotFinishedEventData = {
          ts: Date.now (),
          t: PAYLOAD_EVENT.INFO_BOT_FINISHED
        };
      }

      const eventData = [infoBotFieldCapturedEventData];

      if (infoBotFinishedEventData) {
        eventData.push (infoBotFinishedEventData);
      }

      const eventPayload = {
        e: JSON.stringify (eventData)
      };

      _fireTrackingXhr (eventPayload);
    };

    /**
     * Track the given event with relevant data.
     * @param {string} event - The event to track.
     * @param {Object} [config]
     */
    const track = (event, config) => {
      // Do not track the event if initiated via a search engine bot or crawler.
      if (!_isBot) {
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
          case EVENT.ANS_BOT_REQUESTED:
            _trackAnsBotRequested (config);
            break;
          case EVENT.ANS_BOT_RESULT:
            _trackAnsBotResult (config);
            break;
          case EVENT.FAQ_READ:
            _trackFaqRead (config);
            break;
          case EVENT.ISSUE_DEFLECTION:
            _trackIssueDeflection (config);
            break;
          case EVENT.INFO_BOT_REQUESTED:
            _trackInfoBotRequested ();
            break;
          case EVENT.INFO_BOT_FIELD_CAPTURED:
            _trackInfoBotFieldCaptured ();
            break;
        }
      }
    };

    return {
      track
    };
  });
