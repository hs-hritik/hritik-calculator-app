/**
 * Constants for proactive chat rules.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 7 Nov, 2017
 */

define ("constants/proactiveChat",
  function () {
    "use strict";

    return {
      CONDITION: {
        TAG: "tag",
        TIME_ON_PAGE: "time_on_page",
        TIME_ON_SITE: "time_on_site",
        PAGE_URL: "page_url",
        TIME_LOGIC: "time_logic"
      },
      OPERATOR: {
        EQUALS: "equals",
        SET: "set",
        OPEN: "open"
      },
      ACTION: {
        GREETING: "greeting_message",
        TAG: "tag",
        CIF: "cif",
        WIDGET: "widget"
      }
    };
  });
