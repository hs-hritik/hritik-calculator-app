/**
 * Entities reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/entitiesReducer",
  ["reducers/issuesReducer",
    "reducers/messagesReducer",
    "reducers/authorsReducer",
    "reducers/faqsReducer"],
  function (issuesReducer, messagesReducer, authorsReducer, faqsReducer) {
    "use strict";

    return Redux.combineReducers ({
      issues: issuesReducer,
      messages: messagesReducer,
      authors: authorsReducer,
      faqs: faqsReducer
    });
  }
);
