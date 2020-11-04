/**
 * liveUpdates helper.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 16, 2017
 */

define("helpers/liveUpdates", [
  "store",
  "constants/routes",
  "gunpowder/utils/xhr",
  "gunpowder/utils/pubsub",
  "actions/actionCreators",
  "helpers/xhr",
  "utils/liveUpdates"
], function(store, routes, xhr, pubsub, actionCreators, xhrHelpers, liveUpdatesUtil) {
  "use strict";

  const AGENT_ACTIVITY_EVENT_NAME = "live:agent_type_activity",
    AGENT_ACTIVITY_ACTIONS = {
      START: "start",
      STOP: "stop"
    };

  let subscribedToLiveUpdates = false,
    agentActivityListener = null,
    agentActivityTimer = null;

  /**
   * Opens a new web socket connection.
   * Do nothing if web socket connection is already opened.
   * @param {Object} callbacks - Object containing all the callbacks
   * @param {Function} callbacks.onWsConfigFromBackend - Callback function to dispatch
   * ws config success action
   */
  const openWsConnection = (callbacks) => {
    if (subscribedToLiveUpdates) {
      return;
    }

    xhrHelpers.getWsConfig({
      onGetWsConfig: ({endpoint, token}) => {
        const {platformId, domain} = store.getState().appState;

        subscribedToLiveUpdates = true;

        const wsRoute = routes.webSocket(domain, platformId, endpoint, token);
        liveUpdatesUtil.init(wsRoute);
      },
      onWsConfigFromBackend: callbacks.onWsConfigFromBackend
    });
  };

  /**
   * Get agent activity topic name.
   * @returns {String} - agent activity topic name
   */
  const getAgentActivityTopic = () => {
    const {
      appState: {internalIssueId}
    } = store.getState();

    return `agent_type_act.issue.${internalIssueId}`;
  };

  /**
   * Subscribe to agent activity topic.
   */
  const subscribeAgentActivityTopic = () => {
    liveUpdatesUtil.subscribe(getAgentActivityTopic());
  };

  /**
   * Unsubscribe from agent activity topic.
   */
  const unsubscribeAgentActivityTopic = () => {
    liveUpdatesUtil.unsubscribe(getAgentActivityTopic());
  };

  /**
   * Handler for agent activity events.
   * Dispatch actions to start/stop agent typing.
   */
  const attachAgentActivityListener = () => {
    agentActivityListener = pubsub.on(AGENT_ACTIVITY_EVENT_NAME, (ev) => {
      const {action, ttl} = ev.message;

      if (agentActivityTimer) {
        window.clearTimeout(agentActivityTimer);
      }

      if (action === AGENT_ACTIVITY_ACTIONS.START) {
        store.dispatch(actionCreators.toggleAgentTyping(true));

        // Start timer to stop agent activity after ttl.
        agentActivityTimer = window.setTimeout(() => {
          store.dispatch(actionCreators.toggleAgentTyping(false));
          agentActivityTimer = null;
        }, ttl * 1000);
      } else if (action === AGENT_ACTIVITY_ACTIONS.STOP) {
        store.dispatch(actionCreators.toggleAgentTyping(false));
      }
    });
  };

  /**
   * Detach agent activity listener.
   */
  const detachAgentActivityListener = () => {
    if (agentActivityListener) {
      agentActivityListener.detach();
      agentActivityListener = null;
    }
  };

  return {
    openWsConnection,
    subscribeAgentActivityTopic,
    unsubscribeAgentActivityTopic,
    attachAgentActivityListener,
    detachAgentActivityListener
  };
});
