/**
 * Jump to Latest Button
 * @author Shubham Jain <shubham@helpshift.com>
 * @created June 13, 2018
 */

define ("components/jumpToLatestBtn",
  function () {
    "use strict";

    const PropTypes = React.PropTypes;
    return React.createClass ({
      displayName: "JumpToLatestBtn",
      propTypes: {
        show: PropTypes.bool,
        unreadIndicator: PropTypes.bool,
        onClick: PropTypes.func
      },

      getDefaultProps () {
        return {
          show: true
        };
      },

      render () {
        if (!this.props.show) {
          return null;
        }

        const unreadIndicatorEl = this.props.unreadIndicator ?
          (<span className="hs-jump-to-latest__unread-icon" />) : null;

        return (
          <div className="hs-jump-to-latest" onClick={this.props.onClick}>
            <i className="ion-chevron-right hs-jump-to-latest__icon" />
            {unreadIndicatorEl}
          </div>
        );
      }
    });
  }
);
