/**
 * StarRating Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 17, 2017
 */

define ("components/starRating",
  function () {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "StarRating",
      propTypes: {
        value: PropTypes.number.isRequired,
        editing: PropTypes.bool,
        starCount: PropTypes.number,
        onStarClick: PropTypes.func
      },

      getDefaultProps () {
        return {
          starCount: 5,
          editing: true
        };
      },

      render () {
        return (
          <div>
            {this._renderStars ()}
          </div>
        );
      },

      _renderStars () {
        const {starCount} = this.props;
        const starElements = [];

        for (let idx = 1; idx <= starCount; idx++) {
          starElements.push (this._renderStar (idx));
        }

        return starElements;
      },

      _renderStar (idx) {
        const {editing, value} = this.props;

        // @TODO: Move styles to css.
        const starStyles = {
          cursor: editing ? "pointer" : "default",
          color: value >= idx ? "#ffb400" : "#333"
        };

        return (
          <i className="ion-star" style={starStyles}
             key={idx}
             onClick={this._onStarClick.bind (this, idx)} />
        );
      },

      /**
       * Click handler for star.
       */
      _onStarClick (index) {
        const {onStarClick, editing} = this.props;

        if (!editing) {
          return;
        }
        if (onStarClick) {
          onStarClick (index);
        }
      }
    });
  }
);
