/**
 * Global events which are registered for whole web chat and are not
 * specific to any component.
 * @author Aniket Hendre <aniket@helpshift.com>
 * @created Oct 24, 2018
 */

define (
  "extras/globalEvents",
  [
    "store",
    "actions/appState",
    "actions/chatView"
  ],
  function (store, appStateActions, chatViewActions) {
    "use strict";

    const {dispatch} = store;

    /**
     * Register listener for focus event on window
     */
    const _addFocusEventListener = () => {
      window.addEventListener ("focus", () => {
        dispatch (appStateActions.setWindowIsFocused (true));
        dispatch (chatViewActions.markMessagesSeen ());
      }, false);
    };

    /**
     * Register listener for blur event on window
     */
    const _addBlurEventListener = () => {
      window.addEventListener ("blur", () => {
        dispatch (appStateActions.setWindowIsFocused (false));
      }, false);
    };

    /**
     * Register listeners for focus & blur events on window
     */
    const addFocusAndBlurEventListener = () => {
      _addFocusEventListener ();
      _addBlurEventListener ();
    };

    return {
      addFocusAndBlurEventListener
    };
  }
);
