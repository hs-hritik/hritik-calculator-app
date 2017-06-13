/**
 * UI reducer.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 1, 2017
 */

define ("reducers/ui",
  function () {
    "use strict";

    const INITIAL_STATE = {
      text: {
        chatHeader: "Chat with us",
        faqMessageHeader: "Do these FAQs solve your problem?",
        faqHelpful: "Yes, they were helpful",
        faqNotHelpful: "No, I want to talk to agent",
        problemSolved: "Yes, Thanks!",
        problemNotSolved: "No",
        faqWindowHeader: "Back to messages"
      }
    };

    return (state = INITIAL_STATE, action) => {
      switch (action.type) {
        default:
          return state;
      }
    };
  }
);
