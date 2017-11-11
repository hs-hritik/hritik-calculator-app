/**
 * Attachments Helper
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Nov 10, 2017
 */

define ("helpers/attachments",
  ["constants/attachments"],
  function (ATTACHMENT_CONSTANTS) {
    "use strict";

    const {
      MAX_ATTACHMENT_LIMIT,
      ATTACHMENT_OPERATIONS,
      MAX_FILE_SIZE,
      UNITS,
      UNITS_LIST,
      MAX_CHAR_LIMIT,
      MAX_EXTENSION_LIMIT,
      ELLIPSIS_LENGTH
    } = ATTACHMENT_CONSTANTS;

    /**
     * Converts bytes to object containing size and unit
     * @param {Number} bytes - Size of file in bytes
     * @returns {Object} - Object containing size and unit
     */
    const getConvertedSize = (bytes) => {
      if (bytes < 1024) {
        return {
          size: bytes,
          unit: UNITS.BYTES
        };
      }
      const unit = parseInt (Math.floor (Math.log (bytes) / Math.log (1024)), 10);
      const size = Math.round (bytes / Math.pow (1024, unit), 2);

      return {
        size,
        unit: UNITS_LIST [unit]
      };
    };

    /**
     * Function to humanize given file size in bytes
     * @param {Number} bytes - Size of file in bytes
     * @returns {String} - returns humanized string
     */
    const humanizeFileSize = (bytes) => {
      const converted = getConvertedSize (bytes);
      return `${converted.size} ${converted.unit}`;
    };

    /**
     * Predicate to return validity of number of attachments
     * @param {Number} prevLength - length of previously set attachments
     * @param {Number} newLength - length of new attachments
     * @param {String} operation - type of operation performed (add/remove)
     * @returns {Boolean} - attachment number limit is valid
     */
    const isAttachmentsNumberValid = (prevLength, newLength, operation) => {
      if (operation === ATTACHMENT_OPERATIONS.ADD) {
        return (prevLength + newLength) <= MAX_ATTACHMENT_LIMIT;
      }

      return (prevLength - newLength) <= MAX_ATTACHMENT_LIMIT;
    };

    /**
     * Predicate to return validity of attachments size
     * @param {Number} bytes - Size of file in bytes
     * @returns {Boolean} - attachment size is valid
     */
    const isAttachmentsSizeValid = (bytes) => {
      const converted = getConvertedSize (bytes);
      const indexOfMb = UNITS_LIST.indexOf (UNITS.MB);
      const greaterThanMb = UNITS_LIST.indexOf (converted.unit) > indexOfMb;

      if ((converted.unit === UNITS.MB && converted.size >= MAX_FILE_SIZE) ||
           greaterThanMb) {
        return false;
      }

      return true;
    };

    /**
     * Return formatted file name
     * @param {String} - file name
     * @returns {String} - ellipsis string
     */
    const getFormattedFileName = (fileName) => {
      if (fileName.length <= MAX_CHAR_LIMIT) {
        return fileName;
      }

      const fileNameArr = fileName.split (".");
      // If there are multiple dots in file name, then get the last extension
      // Example :- File name can be "hello.world.text";
      let extension = fileNameArr.length > 1 ?
                      fileNameArr [fileNameArr.length - 1] : "";

      // If extension length is greater that MAX_EXTENSION_LIMIT then
      // get last allowed characters of extension
      // Example :- a-large-patch-file-name.having.other.multiple.extensions
      const extensionLength = extension.length;
      if (extensionLength > MAX_EXTENSION_LIMIT) {
        extension = extension.slice (
          extensionLength - MAX_EXTENSION_LIMIT,
          extensionLength
        );
      }

      // Note :- We are using extension.length again as the extension can change
      const nameLimit = MAX_CHAR_LIMIT - ELLIPSIS_LENGTH - extension.length;
      const nameStr = fileName.slice (0, nameLimit);

      return `${nameStr}...${extension}`;
    };

    return {
      humanizeFileSize,
      isAttachmentsNumberValid,
      isAttachmentsSizeValid,
      getFormattedFileName
    };
  }
);
