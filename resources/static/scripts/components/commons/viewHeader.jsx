/**
 * ViewHeader Component.
 * Common header component for different views.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 13, 2017
 */

define("components/commons/viewHeader", [
  "gunpowder/utils/classes",
  "constants/avatar",
  "components/commons/avatar",
  "utils/browser"
], function(classes, AVATAR_CONSTANTS, avatarEsm, browserUtils) {
  "use strict";
  const Avatar = avatarEsm.default;

  const {FALLBACK_AVATAR_BASE64} = AVATAR_CONSTANTS;

  const IS_MOBILE = browserUtils.isMobile();

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
      avatarUrl: PropTypes.string,
      /**
       * Fallback image url when original image takes time to load
       */
      fallbackAvatar: PropTypes.string
    },

    getDefaultProps() {
      return {
        showAvatar: false,
        avatarUrl: "",
        showBackBtn: false,
        showCloseBtn: false,
        fallbackAvatar: FALLBACK_AVATAR_BASE64.APP
      };
    },

    getInitialState() {
      return {
        avatarIsLoaded: false
      };
    },

    render() {
      const {showAvatar} = this.props;
      const headerClasses = classes("hs-header", {
        "hs-header--with-avatar": showAvatar,
        "hs-header--mobile": IS_MOBILE
      });

      if (IS_MOBILE) {
        return (
          <div className={headerClasses}>
            {this._renderCloseButton()}
            {this._renderTitleAndAvatar()}
          </div>
        );
      }

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

      return <Avatar showAvatar={showAvatar} avatarUrl={avatarUrl} className="hs-header__avatar" />;
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
     * On load handler for image
     */
    _onAvatarLoad() {
      this.setState({
        avatarIsLoaded: true
      });
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
