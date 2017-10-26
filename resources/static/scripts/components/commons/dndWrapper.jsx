/**
 * Helpshift Drag and Drop Wrapper Component.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 26, 2017
 */

define ("components/commons/dndWrapper",
  function () {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "DnDWrapper",
      propTypes: {
        /**
         * Drop handler for files drop
         */
        onDrop: PropTypes.func.isRequired,

        /**
         * Info text when files are dragged on container
         */
        dragInfoText: PropTypes.string
      },
      getInitialState () {
        return {
          filesAreDragged: false
        };
      },

      render () {
        return (
          <div className="hs-dnd-wrapper"
               onDrag={this._defaultEventHandler}
               onDragStart={this._defaultEventHandler}
               onDragOver={this._defaultEventHandler}
               onDragEnd={this._defaultEventHandler}
               onDragEnter={this._onDragEnter}
               onDragLeave={this._onDragLeave}
               onDrop={this._onDrop}>
            {this._renderContents ()}
          </div>
        );
      },

      /**
       * Render drag and drop container contents
       */
      _renderContents () {
        // If file is dragged over, show a drag container and drag info text
        if (this.state.filesAreDragged) {
          let infoTextEl = null;

          if (this.props.dragInfoText) {
            infoTextEl = (
              <span>{this.props.dragInfoText}</span>
            );
          }

          return (
            <div className="hs-dnd-wrapper__drop-area">
              {infoTextEl}
            </div>
          );
        }

        return this.props.children;
      },

      /**
       * Default handler for drag and drop events
       * @param {Object} ev - event object
       */
      _defaultEventHandler (ev) {
        // Prevent default behaviour of drag and drop events.
        // This is to prevent default browser behaviour of displaying file in
        // same tab itself.
        ev.preventDefault ();
        // Stop event propagation so that it does not conflict with other
        // drag and drop event handlers attached on other elements.
        ev.stopPropagation ();
      },

      /**
       * Handler for drag enter on dnd container
       * @param {Object} ev - event object
       */
      _onDragEnter (ev) {
        this._defaultEventHandler (ev);
        this.setState ({
          filesAreDragged: true
        });
      },

      /**
       * Handler for drag leave on dnd container
       * @param {Object} ev - event object
       */
      _onDragLeave (ev) {
        this._defaultEventHandler (ev);
        this.setState ({
          filesAreDragged: false
        });
      },

      /**
       * Handler for drop on dnd container
       * @param {Object} ev - event object
       */
      _onDrop (ev) {
        this._defaultEventHandler (ev);
        this.setState ({
          filesAreDragged: false
        });
        this.props.onDrop (ev.dataTransfer.files);
      }
    });
  }
);
