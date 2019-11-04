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
    "actions/actionCreators",
    "constants/keyCodes"
  ],
  function (store, appStateActions, chatViewActions, actionCreators, KEY_CODES) {
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

          // Simulating a click on keypress has some side-effects.
          // More context - On keypress we update the keyboardInteractionIsActive
          // value in the state to true, on click we set it to false.
          // In case the enter key is pressed, say pressing enter on an FAQ title
          // of the answer bot, it navigates to the FAQ view because of the click
          // simulation but it also sets the keyboardInteractionIsActive to false.
          // Keeping the keyboardInteractionIsActive flag to true in this case to
          // avoid this.
          dispatch (actionCreators.setKeyboardInteractionIsActive (true));
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
