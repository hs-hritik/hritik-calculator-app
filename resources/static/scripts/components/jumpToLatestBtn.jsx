/**
 * Jump to Latest Button
 * @author Shubham Jain <shubham@helpshift.com>
 * @created June 13, 2018
 */

define ("components/jumpToLatestBtn",
  ["gunpowder/utils/classes"],
  function (classes) {
    "use strict";

    const PropTypes = React.PropTypes;
    return React.createClass ({
      displayName: "JumpToLatestBtn",
      propTypes: {
        show: PropTypes.bool,
        skipBtnIsRendered: PropTypes.bool,
        chatFooterIsHidden: PropTypes.bool,
        showUnreadIndicator: PropTypes.bool,
        onClick: PropTypes.func
      },

      getDefaultProps () {
        return {
          show: true
        };
      },

      render () {
        const {
          show,
          showUnreadIndicator,
          onClick,
          skipBtnIsRendered,
          chatFooterIsHidden
        } = this.props;

        if (!show) {
          return null;
        }

        const jumpToLatestBtnClasses = classes (
          "hs-jump-to-latest", {
            "hs-jump-to-latest--without-input-footer": chatFooterIsHidden,
            "hs-jump-to-latest--with-skip-btn": !chatFooterIsHidden && skipBtnIsRendered
          }
        );

        const unreadIndicatorEl = showUnreadIndicator ?
          (<span className="hs-jump-to-latest__unread-icon" />) : null;

        return (
          <div className={jumpToLatestBtnClasses} onClick={onClick}>
            <i className="ion-chevron-right hs-jump-to-latest__icon" />
            {unreadIndicatorEl}
          </div>
        );
      }
    });
  }
);
