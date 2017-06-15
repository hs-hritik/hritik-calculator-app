/**
 * Action type constants.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 8, 2017
 */

define ("constants/actionTypes",
  function () {
    "use strict";

    return {
      SET_USER: "SET_USER",
      SET_USER_ID: "SET_USER_ID",
      SET_CONFIG: "SET_CONFIG",
      SET_ENTITIES: "SET_ENTITIES",
      SET_ACTIVE_ISSUE: "SET_ACTIVE_ISSUE",
      UPDATE_ACTIVE_VIEW: "UPDATE_ACTIVE_VIEW",
      UPDATE_REPLY_TEXT: "UPDATE_REPLY_TEXT",
      ADD_MESSAGES: "ADD_MESSAGES",
      SET_ACTIVE_ISSUE_MSG_CURSOR: "SET_ACTIVE_ISSUE_MSG_CURSOR"
    };
  });
