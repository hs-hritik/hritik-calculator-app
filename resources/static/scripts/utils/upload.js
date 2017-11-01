/**
 * Upload file utility
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created 8 Nov, 2017
 */
define ("utils/upload", function () {
  "use strict";

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
      // @TODO :- Handle mirkwood specific failures
      switch (event.target.status) {
        case 200:
        case 201:
          config.onSuccess (JSON.parse (this.responseText));
          break;
        case 413:
          config.onFailure ({
            error     : true,
            errorMsg  : "Entity too large",
            errorCode : 3
          });
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
            errorCode : 5
          });
          break;
        default:
          config.onFailure ({
            error     : true,
            errorMsg  : "Default error",
            errorCode : 4
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
        errorCode : 0
      });
    };
  };
});
