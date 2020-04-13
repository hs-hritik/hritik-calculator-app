/**
 * ViewHeader Component.
 * Common header component for different views.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 13, 2017
 */

define("components/commons/viewHeader", ["gunpowder/utils/classes"], function(classes) {
  "use strict";

  return createReactClass({
    displayName: "ViewHeader",
    propTypes: {
      title: PropTypes.string.isRequired,
      showBackBtn: PropTypes.bool,
      showCloseBtn: PropTypes.bool,
      onBackBtnClick: PropTypes.func,
      onCloseBtnClick: PropTypes.func,
      dataLabels: PropTypes.shape({
        backBtnDataLabel: PropTypes.string
      }),
      ariaLabel: PropTypes.string,
      showAvatar: PropTypes.bool,
      avatarUrl: PropTypes.string
    },

    getDefaultProps() {
      return {
        showAvatar: false,
        avatarUrl: null,
        showBackBtn: false,
        showCloseBtn: false
      };
    },

    render() {
      const {showAvatar} = this.props;
      const headerClasses = classes("hs-header", {
        "hs-header--with-avatar": showAvatar
      });

      return (
        <div className={headerClasses}>
          {this._renderTitleAndAvatar()}
          {this._renderCloseButton()}
        </div>
      );
    },

    /**
     * This function renders one of the following combinations
     * - Only title
     * - Avatar & title
     * - Back button & title
     * - Back button, avatar and title
     */
    _renderTitleAndAvatar() {
      const {dataLabels, ariaLabel} = this.props;
      const titleText = <span className="hs-header__title-text">{this.props.title}</span>;

      if (!this.props.showBackBtn) {
        return (
          <div className="hs-header__avatar-title-wrapper">
            {this._renderAvatar()}
            {titleText}
          </div>
        );
      }

      return (
        <a
          className="hs-header__back-btn-link"
          onClick={this._onBackBtnClick}
          tabIndex="0"
          data-label={dataLabels.backBtnDataLabel}
          aria-label={ariaLabel}
          role="button">
          <i className="ion-chevron-left hs-header__back-icon" />
          {this._renderAvatar()}
          {titleText}
        </a>
      );
    },

    _renderAvatar() {
      const {showAvatar, avatarUrl} = this.props;

      if (!showAvatar) {
        return null;
      }

      return <img src={avatarUrl} alt="Avatar Image" className="hs-header__avatar" aria-hidden />;
    },

    /**
     * Render close button
     */
    _renderCloseButton() {
      if (!this.props.showCloseBtn) {
        return null;
      }

      return (
        <a className="hs-header__close-btn-link" onClick={this._onCloseBtnClick}>
          <i className="ion-cross hs-header__close-icon" />
        </a>
      );
    },

    /**
     * Click handler for back button.
     */
    _onBackBtnClick() {
      if (this.props.onBackBtnClick) {
        this.props.onBackBtnClick();
      }
    },

    /**
     * Click handler for close button.
     */
    _onCloseBtnClick() {
      if (this.props.onCloseBtnClick) {
        this.props.onCloseBtnClick();
      }
    }
  });
});
