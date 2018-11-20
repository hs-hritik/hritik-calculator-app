/**
 * File Input Component.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Nov 8, 2017
 */

define ("components/commons/fileInput",
  ["gunpowder/utils/classes"],
  function (classes) {
    "use strict";

    const DEFAULT_ACCEPT = ".zip, .rar, .tar, .gzip, .mp3, .mpeg, .wav, .ogg, .amr, .jpeg, " +
                           ".jpg, .png, .gif, .bmp, .txt, .rtf, .webm, .mpeg4, .3gpp, .mov, " +
                           ".avi, .mpegps, .wmv, .flv, .ogg, .qt, .doc, .docx, .xls, .xlsx, " +
                           ".ppt, .pptx, .log, .pdf, .tif, .tiff, .csv";

    const DEFAULT_ACCEPT_MIME_TYPES = [
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

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "FileInput",
      propTypes: {
        /**
         * By default the widget will accept all types of files.
         * But you can define what kind of files the widget should accept.
         * Refer to following link for more details:
         * https://developer.mozilla.org/en/docs/Web/HTML/Element/Input#attr-accept
         */
        accept: PropTypes.string,

        /**
         * Even if we provide the "accept" param to input file, the user cannot be restricted
         * from selecting "All Files" in the file select dialogue and that will enable the
         * user to upload any kind of file. For this, we can check the mime type of the file
         * too. For this, the allowed mime types can be passed as props.
         */
        acceptMimeTypes: PropTypes.arrayOf (PropTypes.string),

        /**
         * Change handler for files select
         */
        onChange: PropTypes.func.isRequired,

        /**
         * Icon classes
         */
        iconClasses: PropTypes.string.isRequired,

        /**
         * Info text to be displayed
         */
        infoText: PropTypes.string,

        /**
         * Disable input type
         */
        disabled: PropTypes.bool,

        /**
         * No padding for content
         */
        noPadding: PropTypes.bool,

        /**
         * Label classes
         */
        labelClasses: PropTypes.string
      },

      getDefaultProps () {
        return {
          accept: DEFAULT_ACCEPT,
          acceptMimeTypes: DEFAULT_ACCEPT_MIME_TYPES
        };
      },

      getInitialState () {
        return {
          fileInputValue: ""
        };
      },

      render () {
        const {
          infoText,
          iconClasses,
          disabled,
          noPadding,
          labelClasses,
          accept
        } = this.props;
        let infoTextEl = null;

        if (infoText) {
          infoTextEl = (
            <span className="hs-file-input__info-text">{infoText}</span>
          );
        }

        const primaryIconClasses = classes (
          "hs-file-input__icon",
          iconClasses
        );

        const fileInputClasses = classes (
          labelClasses,
          "hs-file-input", {
            "hs-file-input--disabled": disabled,
            "hs-file-input--no-padding": noPadding
          }
        );

        return (
          <div>
            <label htmlFor="upload-file" className={fileInputClasses}>
              <i className={primaryIconClasses} />
              {infoTextEl}
            </label>
            <input type="file"
                   value={this.state.fileInputValue}
                   id="upload-file"
                   multiple={true}
                   accept={accept}
                   disabled={disabled}
                   className="hs-file-input__file"
                   onChange={this._onFilesChange} />
          </div>
        );
      },

      /**
       * Handler for files change
       * @param {Object} ev - event object
       */
      _onFilesChange (ev) {
        this.setState ({
          fileInputValue: ""
        });

        const {files} = ev.target;

        if (!this._areAllFilesValid (files)) {
          // @TODO: Handle showing of error message
        }

        this.props.onChange (files);
      },

      /**
       * Check that given file has the the expected valid mime-types.
       * It will return true if no mime types are passed.
       * @param {Object} file
       * @returns {Boolean}
       */
      _isMimeTypeValid: function (file) {
        const {acceptMimeTypes} = this.props;

        const fileType = file.type;
        const mimeTypesAreValid = (
          Array.isArray (acceptMimeTypes) && acceptMimeTypes.length
        );

        // skip the check if acceptMimeTypes isn't
        // there or if file deosn't have a mime type. e.g: text file.
        if (!fileType || !mimeTypesAreValid) {
          return true;
        }

        return acceptMimeTypes.indexOf (file.type) > -1;
      },

      /**
       * Predicate for checking if all files are valid or not
       * @param {Object[]} files
       * @returns {Boolean}
       */
      _areAllFilesValid: function (files) {
        return Array.prototype.every.call (files, this._isMimeTypeValid);
      }
    });
  }
);
