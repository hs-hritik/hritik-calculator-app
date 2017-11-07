/**
 * Upload file utility
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created 8 Nov, 2017
 */
define ("utils/upload",
  ["constants/errors"],
  function (errorConstants) {
    "use strict";

    const {FILE_UPLOAD_ERRORS} = errorConstants;

    return function (config) {
      var response, errorMsg, key, xhr;
      var file = config.file;
      var headers = config.headers;
      var header = null;
      var route = config.route;
      var formData = new FormData ();

      formData.append ("attachment", file);

      if (config.formData) {
        for (key in config.formData) {
          if (config.formData.hasOwnProperty (key)) {
            formData.append (key, config.formData [key]);
          }
        }
      }

      xhr = new XMLHttpRequest ();
      xhr.open ("POST", route, true);

      for (header in headers) {
        if (headers.hasOwnProperty (header)) {
          xhr.setRequestHeader (header, headers[header]);
        }
      }

      xhr.onload = function (event) {
        switch (event.target.status) {
          case 201:
            config.onSuccess (JSON.parse (this.responseText));
            break;

          case 400:
            // if there is a response message, use that.
            try {
              response = JSON.parse (this.responseText);
              errorMsg = response.msg || "Default error";
            } catch (e) {
              errorMsg = "Default error";
            }
            config.onFailure ({
              error     : true,
              errorMsg  : errorMsg,
              errorCode : FILE_UPLOAD_ERRORS.RETRY
            });
            break;

          default:
            config.onFailure ({
              error     : true,
              errorMsg  : "Default error",
              errorCode : FILE_UPLOAD_ERRORS.FAILURE
            });
        }
      };
      xhr.send (formData);

      return function () {
        xhr.abort ();
        xhr = null;
        config.onFailure ({
          error     : true,
          errorMsg  : "Aborted",
          errorCode : FILE_UPLOAD_ERRORS.ABORTED
        });
      };
    };
  }
);
