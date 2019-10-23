/**
 * Util to log React 16 render error
 * @author Nachiket Kakatkar <nachiket@helpshift.com>
 * @created Sep 16, 2019
 */
define (
  "utils/logReactError",
  [
    "gunpowder/utils/xhr"
  ],
  function (xhr) {
    "use strict";

    const STACK_SIZE = 10;
    const MAX_LOGS_PER_SESSION = 10;
    const ERR_SLICE_LEN = 100;

    // NOTE: Increment this every time you make changes to the log
    const LOG_VERSION = "0.6";

    let logCount = 0;

    /**
     * Creates error info and fires dummy XHR for logging render error thrown
     * by a React component
     * @param {object} error - The error object passed by componentDidCatch
     * method of the React component
     * @param {object} info - The info object passed by componentDidCatch
     * method of the React component
     */
    return (error, info) => {
      if (logCount > MAX_LOGS_PER_SESSION) {
        return;
      }

      let errorStackStr, componentStackStr, errorMsg, errorStack;

      if (error) {
        if (typeof error.stack === "string") {
          errorStack = error.stack.split ("\n");

          // If there are more than STACK_SIZE stack trace lines, pick the
          // first (STACK_SIZE / 2 + 1) and last (STACK_SIZE / 2) stack trace lines.
          // Pick the first (STACK_SIZE / 2 + 1) lines because the first line can
          // be the error msg in some browsers.
          if (errorStack.length > (STACK_SIZE + 1)) {
            const halfStackLen = STACK_SIZE / 2;
            errorStack = errorStack.slice (0, halfStackLen + 1).concat (
              errorStack.slice (-1 * halfStackLen)
            );
          }

          errorStackStr = errorStack.map ((str) => {
            if (str.length <= ERR_SLICE_LEN * 2) {
              return str;
            }

            return str.slice (0, ERR_SLICE_LEN) + "....." + str.slice (-1 * ERR_SLICE_LEN);
          }).join ("__");
        } else {
          errorStackStr = "No error stack";
        }

        if (error.message) {
          errorMsg = error.message;
        } else {
          errorMsg = "No error msg";
        }

      } else {
        errorStackStr = "No error";
      }

      if (info && typeof info.componentStack === "string") {
        componentStackStr = info.componentStack.split ("\n").join ("__");
      } else {
        componentStackStr = "No component stack";
      }

      let profileId;
      if (window.HS) {
        profileId = window.HS.profileId;
      } else if (window.HSM) {
        profileId = window.HSM.profileId;
      } else {
        profileId = "No profileId";
      }

      xhr ({
        // Note: This is a dummy XHR route which is expected to be logged
        // in the nginx logs. The params in the GET request will be used to
        // determine the source of the error, through Kibana logs
        route: "/xhr/react-error-boundary/",
        data: {
          version: LOG_VERSION,
          message: errorMsg,
          error: errorStackStr,
          component: componentStackStr,
          profileId
        }
      });

      logCount++;
    };
  }
);