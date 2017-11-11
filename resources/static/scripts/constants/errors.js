/**
 * UI Errors related constants.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Nov 7, 2017
 */

define ("constants/errors",
  function () {
    "use strict";

    const FILE_UPLOAD_ERRORS = {
      SIZE_EXCEEDED: 1,
      RETRY: 2,
      FAILURE: 3,
      ABORTED: 4
    };

    return {
      FILE_UPLOAD_ERRORS
    };
  }
);
