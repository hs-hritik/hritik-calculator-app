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
            {this._renderTitle ()}
          </div>
        );
      },

      /**
       * Render title text and the back button if required
       */
      _renderTitle () {
        const titleText = (
          <span>{this.props.title}</span>
        );

        if (!this.props.showBackBtn) {
          return titleText;
        }

        return (
          <a className="hs-header__link" onClick={this.props.onBackBtnClick}>
            <i className="ion-chevron-left hs-header__back-icon" />
            {titleText}
          </a>
        );
      }
    });
  }
);
