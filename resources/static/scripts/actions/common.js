/**
 * Common actions module.
 * The purpose of this module is to have common actions used by entire application.
 * Action creators contain common actions which return only objects.
 * This file contains common async actions which return functions.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created May 21, 2019
 */

define ("actions/common",
  [
    "actions/actionCreators",
    "actions/postSdkMessage",
    "helpers/localStorage"
  ],
  function (actionCreators, postSdkMessage, lsHelpers) {
    "use strict";

    /**
     * Action to reload the application.
     * This action does the following things
     * - Set app reset trigger which is used to decide preIssue creation
     * - Reset webchat state data
     * - Set conversation as ended
     * - Post reset message to parent
     * - Call reset method of lsHelpers
     * - Toggle chat view loader
     * @param {Object} config
     * @param {String} config.trigger - app reset trigger
     * @param {Boolean} [config.loading] - whether to show loader on chat view
     * @param {Function} [config.callback] - additional callback to be executed during reload
     * This callback will mostly be stop poller function.
     */
    const reloadApp = (config) => {
      return (dispatch, getState) => {
        // @TODO: Lazy Preissue Creation
        // Remove config.loading param from the places this fn is called.
        const {trigger, callback} = config;

        // Extra callback to be executed during reset
        if (callback) {
          callback ();
        }

        // The reset call (below) needs to know if the message list should also
        // be reset. Message list is a part of the chat view reducer but the
        // decision has to be made based on the value in the app state reducer -
        // featuresEnabled -> coversationHistory. If conv history is on, retain
        // the message list, else, reset it.
        const {
          appState: {
            featuresEnabled: {
              conversationHistory: messageListShouldNotReset
            }
          }
        } = getState ();

        dispatch (actionCreators.setAppResetTrigger (trigger));
        dispatch (actionCreators.setConversationEnded ());
        dispatch (actionCreators.reset ({
          messageListShouldNotReset
        }));
        dispatch (postSdkMessage.reset ());
        lsHelpers.reset ({
          resetProactiveChat: false
        });
      };
    };

    return {
      reloadApp
    };
  }
);
