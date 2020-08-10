/**
 * Helpers for error handling
 * @author Umang Govil <umang@helpshift.com>
 * @created Aug 18, 2020
 */

/**
 * Detects if the statusCode passed belongs to 5XX HTTP response codes
 * @param {Number} statusCode - Response status code of the xhr
 */
const isServerSideError = (statusCode) => statusCode / 100 === 5;

export {isServerSideError};
