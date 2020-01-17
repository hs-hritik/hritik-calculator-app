/**
 * Utility to log React errors
 * @author Ayush Sachdeva <ayush.sachdeva@helpshift.com>
 * @created Nov 05, 2019
 */

import errorLoggerFactory from "../gunpowder/utils/errorLoggerFactory";

const PROJECT = "mirkwood";
const STACK_SIZE = 10;
const MAX_LOGS_PER_SESSION = 10;
const LINE_LENGTH = 200;

const logReactError = errorLoggerFactory(PROJECT, STACK_SIZE, MAX_LOGS_PER_SESSION, LINE_LENGTH);

export default logReactError;
