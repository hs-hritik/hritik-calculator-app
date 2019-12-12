/**
 * Jump to Latest Button
 * @author Shubham Jain <shubham@helpshift.com>
 * @created June 13, 2018
 */

define("components/jumpToLatestBtn", function() {
  "use strict";

  return createReactClass({
    displayName: "JumpToLatestBtn",
    propTypes: {
      show: PropTypes.bool,
      skipBtnIsRendered: PropTypes.bool,
      chatFooterIsHidden: PropTypes.bool,
      showUnreadIndicator: PropTypes.bool,
      onClick: PropTypes.func,
      ariaLabel: PropTypes.string
    },

    getDefaultProps() {
      return {
        show: true
      };
    },

    render() {
      const {show, showUnreadIndicator, onClick, ariaLabel} = this.props;

      if (!show) {
        return null;
      }

      const unreadIndicatorEl = showUnreadIndicator ? (
        <span className="hs-jump-to-latest__unread-icon" />
      ) : null;

      return (
        <div className="hs-jump-to-latest" onClick={onClick} aria-label={ariaLabel}>
          <i className="ion-chevron-right hs-jump-to-latest__icon" />
          {unreadIndicatorEl}
        </div>
      );
    }
  });
});
