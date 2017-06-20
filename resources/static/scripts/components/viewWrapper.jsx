/**
 * ViewWrapper Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/viewWrapper",
  [
    "constants/activeView",
    "components/containers/chatView",
    "components/containers/faqView"
  ],
  function (ACTIVE_VIEW, ChatViewContainer, FaqViewContainer) {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "ViewWrapper",
      propTypes: {
        activeView: PropTypes.string.isRequired
      },

      render () {
        // @TODO: Add header component.
        return this._renderActiveViewComponent ();
      },

      /**
       * Render the active view component.
       */
      _renderActiveViewComponent () {
        switch (this.props.activeView) {
          case ACTIVE_VIEW.CHAT:
            return <ChatViewContainer />;
          case ACTIVE_VIEW.FAQ:
            return <FaqViewContainer />;
          default:
            return null;
        }
      }
    });
  }
);
