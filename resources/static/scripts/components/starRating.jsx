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

      getInitialState () {
        return {
          hoverValue: 0
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
        const {hoverValue} = this.state;
        let activeStarValue = value;

        if (hoverValue > 0) {
          activeStarValue = hoverValue;
        }

        // @TODO: Move styles to css.
        const starStyles = {
          cursor: editing ? "pointer" : "default",
          color: activeStarValue >= idx ? "#ffb400" : "#333"
        };

        // @TODO: We have to use icons here, but there seems to be an issue
        // with how it's used. Using unicode chars for now.
        // return (
        //   <i className="ion-star" style={starStyles}
        //      key={idx}
        //      onClick={this._onStarClick.bind (this, idx)} />
        // );

        return (
          <span style={starStyles}
                key={idx}
                onMouseEnter={this._onStarMouseEnter.bind (this, idx)}
                onMouseLeave={this._onStarMouseLeave}
                onClick={this._onStarClick.bind (this, idx)}
                className="hs-csat__star">
                &#9733;
          </span>
        );
      },

      /**
       * Handler for mouse enter event.
       */
      _onStarMouseEnter (val) {
        this._updateHoverValue (val);
      },

      /**
       * Handler for mouse leave event.
       */
      _onStarMouseLeave () {
        this._updateHoverValue (0);
      },

      /**
       * Update hover value.
       */
      _updateHoverValue (value) {
        this.setState ({
          hoverValue: value
        });
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
