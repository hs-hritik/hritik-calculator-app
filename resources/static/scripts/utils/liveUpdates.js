/**
 * Admin Live Updates Using WebSockets
 * @author Prajwalit <prajwalit@helpshift.com>
 * @created Mar 28, 2016
 */

define (
  "utils/liveUpdates",
  ["gunpowder/utils/pubsub"],
  function (pubsub) {
    "use strict";

    /* https://helpshift.atlassian.net/wiki/display/PLAT/Dirigent+Websockets+-+Subprotocol+design */
    const DIRI_PROTO = "dirigent-pubsub-v1";
    const DIRI_V1 = {
      EVENT              : 100,
      REPLAY             : 101,
      REPLAY_MSGS        : 102,
      REPLAY_STALE       : 103,
      MULTI_SUB          : 104,
      MULTI_UNSUB        : 105,
      MULTI_SUB_W_REPLAY : 106,
      PING               : 107,
      PONG               : 109
    };

    let connection, lastMsgId, pingChecker, wsEndpoint;
    let connected = false, subscribedTopics = [], buffer = [];

    // Make sure topics is an array
    const prepareTopics = (topics) => {
      if (typeof topics === "string") {
        return [topics];
      }
      return topics;
    };


    const liveUpdateEvent = (data) => {
      pubsub.fire ("live:" + data.message.stream, data);
    };


    const smartRetry = (() => {
      const steps = [1, 1, 1, 1, 1, 5, 10, 10, 30];
      let retryCount = 0;

      return {
        retry: (retryFn) => {
          if (steps [retryCount]) {
            window.setTimeout (retryFn, steps [retryCount] * 1000);
            retryCount += 1;
          }
        },

        reset: () => {
          retryCount = 0;
        },

        getRetryCount: () => {
          return retryCount;
        },

        hasRetryEnded: () => {
          return retryCount === (steps.length - 1);
        }
      };
    }) ();

    const init = (wsRoute) => {
      wsEndpoint = wsRoute;
      open ();
    };

    const open = () => {
      if (connection) {
        return;
      }

      const pingCheckerUpdate = (nextPingLocal) => {
        if (pingChecker) {
          window.clearTimeout (pingChecker);
        }

        pingChecker = window.setTimeout (() => {
          if (connection) {
            connection.close ();
          }
          pubsub.fire ("internet:disconnected:maybe");
        }, nextPingLocal);
      };

      let nextPing = 11000;

      connection = new WebSocket (wsEndpoint, [DIRI_PROTO]);

      connection.onmessage = (ev) => {
        const data = JSON.parse (ev.data);

        switch (data [0]) {
          case DIRI_V1.EVENT:
          case DIRI_V1.REPLAY_MSGS:
            pingCheckerUpdate (nextPing);
            lastMsgId = data [1];

            data [2].forEach ((msg) => {
              const msgData = JSON.parse (msg.m);
              liveUpdateEvent ({
                id      : msg.id,
                message : msgData
              });
            });
            break;

          case DIRI_V1.REPLAY_STALE:
            pubsub.fire ("admin:live-update:stale");
            break;

          case DIRI_V1.PING:
            connection.send (JSON.stringify ([DIRI_V1.PONG]));
            nextPing = (data [1] + 1) * 1000; // One extra second for buffer
            pingCheckerUpdate (nextPing);
            break;
        }
      };

      connection.onopen = () => {
        pingCheckerUpdate (nextPing);
        smartRetry.reset ();
        pubsub.fire ("internet:connected");
        connected = true;

        if (buffer.length !== 0) {
          subscribe (buffer);
        }
      };

      connection.onclose = () => {
        connection = null;
        connected = false;

        if (smartRetry.getRetryCount () > 4) {
          pubsub.fire ("internet:disconnected:maybe");
        }
        if (!smartRetry.hasRetryEnded ()) {
          smartRetry.retry (open);
        } else {
          pubsub.fire ("internet:disconnected");
        }
      };
    };


    const subscribe = (topics) => {
      if (connected) {
        topics = prepareTopics (topics);
        // Remove topics that have already been subscribed to
        topics = topics.filter ((topic) => {
          return subscribedTopics.indexOf (topic) === -1;
        });

        if (topics.length) {
          const topicsStr = JSON.stringify ([DIRI_V1.MULTI_SUB, topics]);
          connection.send (topicsStr);
          subscribedTopics = subscribedTopics.concat (topics);
        }
      } else {
        buffer = buffer.concat (topics);
      }
    };


    const reconnect = () => {
      if (lastMsgId) {
        connection.send (JSON.stringify ([DIRI_V1.MULTI_SUB_W_REPLAY,
          lastMsgId, subscribedTopics]));
      } else {
        connection.send (JSON.stringify ([DIRI_V1.MULTI_SUB, subscribedTopics]));
      }
    };


    const unsubscribe = (topics) => {
      topics = prepareTopics (topics);

      connection.send (JSON.stringify ([DIRI_V1.MULTI_UNSUB, topics]));

      subscribedTopics = subscribedTopics.filter ((t) => {
        return topics.indexOf (t) === -1;
      });
    };


    return {
      init,
      open,
      subscribe,
      reconnect,
      unsubscribe
    };
  }
);
