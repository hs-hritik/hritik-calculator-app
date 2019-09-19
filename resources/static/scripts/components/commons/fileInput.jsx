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
                           ".ppt, .pptx, .log, .pdf, .tif, .tiff, .csvm, .mp4";

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
        labelClasses: PropTypes.string,

        /*
         * Callback to pass the ref of the file input element
         */
        onSaveInputRef: PropTypes.func,

        /**
         * Data label for file input
         */
        dataLabels: PropTypes.object
      },

      getDefaultProps () {
        return {
          accept: DEFAULT_ACCEPT
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
          accept,
          onSaveInputRef,
          dataLabels
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
          <div tabIndex="0" data-label={dataLabels.attachmentBtn}>
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
                   ref={onSaveInputRef}
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

        this.props.onChange (ev.target.files);
      }
    });
  }
);
