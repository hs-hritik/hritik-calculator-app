/**
 * ViewWrapper Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/viewWrapper",
  [
    "components/containers/chatView",
    "constants/activeView"
  ],
  function (ChatViewContainer, ACTIVE_VIEW) {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "ViewWrapper",
      propTypes: {
        activeView: PropTypes.string.isRequired
      },

      render () {
        // @TODO: Add header component.
        return (
          <div>
            {this._renderActiveViewComponent ()}
          </div>
        );
      },

      /**
       * Render the active view component.
       */
      _renderActiveViewComponent () {
        switch (this.props.activeView) {
          case ACTIVE_VIEW.CHAT:
            return <ChatViewContainer />;
          default:
            return null;
        }
      }
    });
  }
);
