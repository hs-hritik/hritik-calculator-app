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
    "actions/chatView",
    "constants/keyCodes"
  ],
  function (store, appStateActions, chatViewActions, KEY_CODES) {
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
     * Register listener to select the interactive element
     */
    const addSelectEventListener = () => {
      document.addEventListener ("keypress", (e) => {
        if (e.keyCode === KEY_CODES.ENTER || e.keyCode === KEY_CODES.SPACE) {
          document.activeElement.click ();
        }
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
      addFocusAndBlurEventListener,
      addSelectEventListener
    };
  }
);
