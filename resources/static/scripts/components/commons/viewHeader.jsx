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

  // @TODO: Lite Sdk - Remove when this is fixed without manipulating the DOM in
  // the componentDidMount
  const SAFARI_MOBILE_ELLIPSES_FIX_IS_NEEDED =
    IS_MOBILE && browserUtils.isPlatformIos() && browserUtils.getIosVersion() <= 12;
  const HEADER_CLOSE_BUTTON_WIDTH = 24;
  // left/right header margin(32px) + avatar width in the header (36px)
  // + header close button width (24px)
  const HEADER_TEXT_OFFSET_WIDTH_WITH_AVATAR = 92;
  const HEADER_TEXT_OFFSET_WIDTH_WITHOUT_AVATAR = 56;

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
        "hs-header--mobile": IS_MOBILE,
        "hs-header--safari-mobile-ellipses-fix": SAFARI_MOBILE_ELLIPSES_FIX_IS_NEEDED
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
      if (!this.props.showCloseBtn || (IS_MOBILE && this.props.showBackBtn)) {
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
    },

    _setTitleWrapperStyles() {
      // @TODO: Lite Sdk: Think of another of doing this instead of directly manipulating the DOM
      const HEADER_TEXT_OFFSET_WIDTH = this.props.showAvatar
        ? HEADER_TEXT_OFFSET_WIDTH_WITH_AVATAR
        : HEADER_TEXT_OFFSET_WIDTH_WITHOUT_AVATAR;

      if (IS_MOBILE) {
        const brandingTitleWrapperEl = document.querySelector(".hs-header__avatar-title-wrapper");

        if (brandingTitleWrapperEl) {
          brandingTitleWrapperEl.style.margin = "0 auto";
          // Compute the current margin-left value of brandingTitleWrapperEl
          // and then subtract the width taken by the close button to center align
          // the branding title wrapper element
          const brandingTitleWrapperElCurrentMarginLeftValue = parseInt(
            window.getComputedStyle(brandingTitleWrapperEl).getPropertyValue("margin-left"),
            10
          );

          if (brandingTitleWrapperElCurrentMarginLeftValue) {
            brandingTitleWrapperEl.style.marginLeft =
              brandingTitleWrapperElCurrentMarginLeftValue - HEADER_CLOSE_BUTTON_WIDTH + "px";
          }
        }

        // In mobile devices with iOS version less than and equal to 12, the branding header
        // title text does not get ellipses. So, to fix that we are setting a min width to
        // the header title text and then after the the header width gets computed, we manipulate
        // the width of the header title text here by removing the header text offset width
        // (margins to the header + avatar width + close button width)
        if (SAFARI_MOBILE_ELLIPSES_FIX_IS_NEEDED) {
          const headerEl = document.querySelector(".hs-header");

          if (headerEl) {
            const headerElWidthValue = parseInt(
              window.getComputedStyle(headerEl).getPropertyValue("width"),
              10
            );

            const brandingTitleTextEl = document.querySelector(".hs-header__title-text");

            if (brandingTitleTextEl && headerElWidthValue) {
              brandingTitleTextEl.style.maxWidth =
                headerElWidthValue - HEADER_TEXT_OFFSET_WIDTH + "px";
            }
          }
        }
      }
    },

    componentDidMount() {
      this._setTitleWrapperStyles();

      window.addEventListener("orientationchange", this._setTitleWrapperStyles);
    },

    componentWillUnmount() {
      window.removeEventListener("orientationchange", this._setTitleWrapperStyles);
    }
  });
});
