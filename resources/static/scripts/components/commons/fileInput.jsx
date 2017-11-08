/**
 * File Input Component.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Nov 8, 2017
 */

define ("components/commons/fileInput",
  function () {
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
        iconClasses: PropTypes.string.isRequired
      },

      render () {
        return (
          <label htmlFor="upload-file" className="hs-file-input">
            <i className={this.props.iconClasses} />
            <input type="file"
                   id="upload-file"
                   multiple={true}
                   className="hs-file-input__file"
                   onChange={this._onFilesChange} />
          </label>
        );
      },

      /**
       * Handler for files change
       * @param {Object} ev - event object
       */
      _onFilesChange (ev) {
        this.props.onChange (ev.target.files);
      }
    });
  }
);
