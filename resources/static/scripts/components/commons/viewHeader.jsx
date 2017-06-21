/**
 * ViewHeader Component.
 * Common header component for different views.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 13, 2017
 */

define ("components/commons/viewHeader",
  function () {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "ViewHeader",
      propTypes: {
        title: PropTypes.string.isRequired,
        showBackBtn: PropTypes.bool,
        onBackBtnClick: PropTypes.func
      },

      render () {
        return (
          <div className="hs-header">
            {this._renderBackButton ()}
            <span>{this.props.title}</span>
          </div>
        );
      },

      /**
       * Render back button if required.
       */
      _renderBackButton () {
        if (!this.props.showBackBtn) {
          return null;
        }

        // @TODO: Replace ← with icon.
        return (
          <a className="hs-header__link" onClick={this.props.onBackBtnClick}>←</a>
        );
      }
    });
  }
);
