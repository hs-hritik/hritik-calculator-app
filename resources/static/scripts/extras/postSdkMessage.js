/**
 * Post sdk messages which would be listened by the parent.
 * @author Manish Garg <manish@helpshift.com>
 * @created August 14, 2017
 */

define ("extras/postSdkMessage",
  [
    "constants/eventTypes",
    "utils/postMessage"
  ],
function (EVENT_TYPES, postMessage) {
  "use strict";

  /**
   * Post message to toggle messenger.
   * @param {Boolean} minimized
   */
  const toggleMessenger = (minimized) => {
    postMessage (EVENT_TYPES.SDK_TOGGLE_MESSENGER, {
      minimized
    });
  };

  /**
   * Post message to indicate reset event.
   */
  const reset = () => {
    postMessage (EVENT_TYPES.SDK_RESET);
  };

  // @TODO: Move other postMessage calls to this module.

  return {
    toggleMessenger,
    reset
  };
});
