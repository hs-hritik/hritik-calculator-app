/**
 * Global events which are registered for whole web chat and are not
 * specific to any component.
 * @author Aniket Hendre <aniket@helpshift.com>
 * @created Oct 24, 2018
 */

define("extras/globalEvents", [
  "store",
  "actions/appState",
  "actions/chatView",
  "domPurify"
], function(store, appStateActions, chatViewActions, DOMPurify) {
  "use strict";

  const {dispatch} = store;

  /**
   * Register listener for focus event on window
   */
  const _addFocusEventListener = () => {
    window.addEventListener(
      "focus",
      () => {
        dispatch(appStateActions.setWindowIsFocused(true));
        dispatch(chatViewActions.markMessagesSeen());
      },
      false
    );
  };

  /**
   * Register listener for blur event on window
   */
  const _addBlurEventListener = () => {
    window.addEventListener(
      "blur",
      () => {
        dispatch(appStateActions.setWindowIsFocused(false));
      },
      false
    );
  };

  /**
   * Register listeners for focus & blur events on window
   */
  const addFocusAndBlurEventListener = () => {
    _addFocusEventListener();
    _addBlurEventListener();
  };

  /**
   * By default, DOMPurify removes the target attribute from the <a> tags. Add a hook to make all
   * links open a new window.
   * Source - https://github.com/cure53/DOMPurify/blob/master/demos/hooks-target-blank-demo.html
   */
  const addDomPurifyTargetHook = () => {
    DOMPurify.addHook("afterSanitizeAttributes", function(node) {
      // set all elements owning target to target=_blank
      if ("target" in node) {
        node.setAttribute("target", "_blank");
        // prevent https://www.owasp.org/index.php/Reverse_Tabnabbing
        node.setAttribute("rel", "noopener noreferrer");
      }
      // set non-HTML/MathML links to xlink:show=new
      if (
        !node.hasAttribute("target") &&
        (node.hasAttribute("xlink:href") || node.hasAttribute("href"))
      ) {
        node.setAttribute("xlink:show", "new");
      }
    });
  };

  return {
    addFocusAndBlurEventListener,
    addDomPurifyTargetHook
  };
});
