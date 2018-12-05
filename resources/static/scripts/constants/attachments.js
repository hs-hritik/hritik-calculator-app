/**
 * Attachments related constants.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Nov 10, 2017
 */

define ("constants/attachments",
  function () {
    "use strict";

    const SUPPORTED_MIME_TYPES = [
      "application/zip", "application/x-rar-compressed", "application/x-tar", "application/x-gzip",
      "audio/mpeg", "audio/wav", "audio/ogg", "image/jpeg", "image/png", "image/gif", "image/bmp",
      "text/plain", "application/rtf", "video/webm", "video/3gpp", "video/quicktime",
      "video/x-msvideo", "video/x-ms-wmv", "video/x-flv", "audio/ogg", "video/ogg",
      "application/msword", "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/pdf", "image/tiff", "text/csv"
    ];

    const MAX_ATTACHMENT_LIMIT = 5;
    const ATTACHMENT_OPERATIONS = {
      ADD: "ADD",
      REMOVE: "REMOVE"
    };
    const UNITS = {
      BYTES: "Bytes",
      KB: "KB",
      MB: "MB",
      GB: "GB"
    };
    const MAX_FILE_SIZE = 25; // Size in MB
    const UNITS_LIST = [UNITS.BYTES, UNITS.KB, UNITS.MB, UNITS.GB];

    // Total character limit is 22
    // 22 = X (name limit) + 3 (ELLIPSIS_LENGTH) + Y (extension)
    const MAX_CHAR_LIMIT = 22;
    const MAX_EXTENSION_LIMIT = 5;
    const ELLIPSIS_LENGTH = 3;
    const BUSINESS_HOURS_ALLOWED_REMOVE_COUNT = 1;

    return {
      MAX_ATTACHMENT_LIMIT,
      ATTACHMENT_OPERATIONS,
      MAX_FILE_SIZE,
      UNITS,
      UNITS_LIST,
      MAX_CHAR_LIMIT,
      MAX_EXTENSION_LIMIT,
      ELLIPSIS_LENGTH,
      BUSINESS_HOURS_ALLOWED_REMOVE_COUNT,
      SUPPORTED_MIME_TYPES
    };
  }
);
