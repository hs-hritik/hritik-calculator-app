/**
 * Environment config values. These values get replaced during babel
 * compile depending on whether the compile is running in the dev
 * or prod environment.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 24 Aug, 2017
 */

define ("constants/envConfig",
  function () {
    "use strict";

    const apiRoot = "https://api.helpshift.com/";

    return {
      apiRoot
    };
  });
