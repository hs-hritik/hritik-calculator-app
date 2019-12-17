/**
 * Info View Component.
 * This component is used to render full screen loader, error messages etc.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Apr 10, 2018
 */

define("components/infoView", ["gunpowder/utils/classes"], function(classes) {
  "use strict";

  return createReactClass({
    displayName: "InfoView",
    propTypes: {
      title: PropTypes.string,
      subtitle: PropTypes.string,
      loading: PropTypes.bool,
      actionBtnText: PropTypes.string,
      onActionBtnClick: PropTypes.func,
      ariaLabel: PropTypes.string
    },

    render() {
      return (
        <div className="hs-info-view">
          {this._renderTitle()}
          {this._renderSubtitle()}
          {this._renderActionBtn()}
          {this._renderLoader()}
        </div>
      );
    },

    _renderTitle() {
      const {title} = this.props;
      if (!title) {
        return null;
      }

      return <div className="hs-info-view__title">{title}</div>;
    },

    _renderSubtitle() {
      const {subtitle} = this.props;
      if (!subtitle) {
        return null;
      }

      return <div className="hs-info-view__subtitle">{subtitle}</div>;
    },

    _renderActionBtn() {
      const {actionBtnText, loading} = this.props;
      if (!actionBtnText || loading) {
        return null;
      }

      // @TODO: Move hs-chat-footer__button and hs-chat-footer__buttons-wrapper
      // to some common place because this will be used across most buttons in web chat.
      const btnClasses = classes("hs-button", "hs-button--hollow", "hs-chat-footer__button");

      return (
        <div className="hs-chat-footer__buttons-wrapper">
          <button className={btnClasses} onClick={this.props.onActionBtnClick}>
            {actionBtnText}
          </button>
        </div>
      );
    },

    /**
     * Render loader
     */
    _renderLoader() {
      if (!this.props.loading) {
        return null;
      }

      const loaderClasses = classes("ion-load-b", "ion--spinning", "hs-info-view__loader");

      return (
        <div aria-label={this.props.ariaLabel}>
          <i className={loaderClasses} />
        </div>
      );
    }
  });
});
