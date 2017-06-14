/**
 * Schema definitions for normalizr.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 8, 2017
 */

define ("helpers/entitySchema",
  ["normalizr"],
  function (normalizr) {
    "use strict";

    const {schema} = normalizr;

    const author = new schema.Entity ("authors"),
          message = new schema.Entity ("messages", {
            author
          }),
          issue = new schema.Entity ("issues", {
            messages: [message]
          }),
          issues = {
            issues: [issue]
          };

    return {
      issues,
      issue,
      message
    };
  });
