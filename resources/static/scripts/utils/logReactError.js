/**
 * Utility to log React errors
 * @author Ayush Sachdeva <ayush.sachdeva@helpshift.com>
 * @created Nov 05, 2019
 */

define("utils/logReactError", ["gunpowder/utils/errorLoggerFactory"], function(errorLoggerFactory) {
  "use strict";

  const PROJECT = "mirkwood";
  const STACK_SIZE = 10;
  const MAX_LOGS_PER_SESSION = 10;
  const LINE_LENGTH = 200;

  const logReactError = errorLoggerFactory(PROJECT, STACK_SIZE, MAX_LOGS_PER_SESSION, LINE_LENGTH);

  return logReactError;
});
