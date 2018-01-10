/**
 * File Input Component.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Nov 8, 2017
 */

define ("components/commons/fileInput",
  ["gunpowder/utils/classes"],
  function (classes) {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "FileInput",
      propTypes: {
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
          labelClasses
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
        this.props.onChange (ev.target.files);
      }
    });
  }
);
