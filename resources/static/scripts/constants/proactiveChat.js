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
        TAG: "tags",
        TIME_ON_PAGE: "time_on_page",
        TIME_ON_SITE: "time_on_site",
        PAGE_URL: "page_url",
        TIME_LOGIC: "time_logic"
      },
      OPERATOR: {
        EQUALS: "equals",
        NOT_EQUALS: "not_equals",
        CONTAINS: "contains",
        DOES_NOT_CONTAIN: "does_not_contain",
        STARTS_WITH: "starts_with",
        SET: "set",
        OPEN: "open"
      },
      ACTION: {
        GREETING: "greeting_message",
        TAG: "tags",
        CIF: "cif",
        WIDGET: "widget"
      }
    };
  });
