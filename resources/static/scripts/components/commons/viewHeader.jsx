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
        showCloseBtn: PropTypes.bool,
        onBackBtnClick: PropTypes.func,
        onCloseBtnClick: PropTypes.func,
        dataLabels: PropTypes.shape ({
          backBtnDataLabel: PropTypes.string
        })
      },

      render () {
        return (
          <div className="hs-header">
            {this._renderTitle ()}
            {this._renderCloseButton ()}
          </div>
        );
      },

      /**
       * Render title text and the back button if required
       */
      _renderTitle () {
        const {dataLabels} = this.props;
        const titleText = (
          <span>{this.props.title}</span>
        );

        if (!this.props.showBackBtn) {
          return titleText;
        }

        return (
          <a
            className="hs-header__link"
            onClick={this._onBackBtnClick}
            tabIndex="0"
            data-label={dataLabels.backBtnDataLabel}>
            <i className="ion-chevron-left hs-header__back-icon" />
            {titleText}
          </a>
        );
      },

      /**
       * Render close button
       */
      _renderCloseButton () {
        if (!this.props.showCloseBtn) {
          return null;
        }

        return (
          <a className="hs-header__link" onClick={this._onCloseBtnClick}>
            <i className="ion-cross hs-header__close-icon" />
          </a>
        );
      },

      /**
       * Click handler for back button.
       */
      _onBackBtnClick () {
        if (this.props.onBackBtnClick) {
          this.props.onBackBtnClick ();
        }
      },

      /**
       * Click handler for close button.
       */
      _onCloseBtnClick () {
        if (this.props.onCloseBtnClick) {
          this.props.onCloseBtnClick ();
        }
      }
    });
  }
);
