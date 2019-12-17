/**
 * Upload file utility
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created 8 Nov, 2017
 */
define("utils/upload", ["constants/errors"], function(errorConstants) {
  "use strict";

  const {FILE_UPLOAD_ERRORS} = errorConstants;

  return function(config) {
    var response, errorMsg, key, xhr;
    // @NOTE :- Do not pass both 'file' and 'files' in config.
    // These configs should be mutually exclusive.
    var file = config.file;
    var files = config.files;
    var headers = config.headers;
    var header = null;
    var route = config.route;
    var formData = new FormData();
    var i;

    // If only one file is present, add it under 'attachment'.
    if (file) {
      formData.append("attachment", file);
    } else if (files) {
      // If multiple files are present, add them under 'attachments'
      for (i = 0; i < files.length; i++) {
        formData.append("attachments", files[i]);
      }
    }

    if (config.formData) {
      for (key in config.formData) {
        if (config.formData.hasOwnProperty(key)) {
          formData.append(key, config.formData[key]);
        }
      }
    }

    xhr = new XMLHttpRequest();
    xhr.open("POST", route, true);

    for (header in headers) {
      if (headers.hasOwnProperty(header)) {
        xhr.setRequestHeader(header, headers[header]);
      }
    }

    xhr.onload = function(event) {
      switch (event.target.status) {
        case 201:
          if (config.onSuccess) {
            config.onSuccess(JSON.parse(this.responseText));
          }
          break;

        case 400:
        case 401:
        case 500:
        case 503:
          // if there is a response message, use that.
          try {
            response = JSON.parse(this.responseText);
            errorMsg = response.msg || "Default error";
          } catch (e) {
            errorMsg = "Default error";
          }

          if (config.onFailure) {
            config.onFailure({
              error: true,
              errorMsg: errorMsg,
              errorCode: FILE_UPLOAD_ERRORS.RETRY,
              responseData: response
            });
          }
          break;

        default:
          if (config.onFailure) {
            config.onFailure({
              error: true,
              errorMsg: "Default error",
              errorCode: FILE_UPLOAD_ERRORS.FAILURE
            });
          }
      }

      if (event.target.readyState === 4 && config.onEnd) {
        config.onEnd();
      }
    };
    xhr.send(formData);

    return function() {
      xhr.abort();
      xhr = null;
      if (config.onAbort) {
        config.onAbort({
          error: true,
          errorMsg: "Aborted",
          errorCode: FILE_UPLOAD_ERRORS.ABORTED
        });
      }
    };
  };
});
