/**
 * StarRating Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 17, 2017
 */

define("components/starRating", [
  "gunpowder/utils/classes",
  "constants/keyCodes",
  "constants/accessibility",
  "extras/accessibility"
], function(classes, KEY_CODES, axConstants, ax) {
  "use strict";

  const {METALIST_ITEMS} = axConstants;

  return createReactClass({
    displayName: "StarRating",
    propTypes: {
      value: PropTypes.number.isRequired,
      editing: PropTypes.bool,
      starCount: PropTypes.number,
      onStarClick: PropTypes.func,
      dataLabels: PropTypes.object,
      onUpdateStarRating: PropTypes.func,
      onSelectStarRating: PropTypes.func
    },

    getDefaultProps() {
      return {
        starCount: 5,
        editing: true
      };
    },

    getInitialState() {
      return {
        hoverValue: 0
      };
    },

    render() {
      const {editing, dataLabels} = this.props;
      const starRatingClasses = classes("hs-star-rating", {
        "hs-star-rating--edit-mode": editing
      });
      const _setAxActiveIndex = this._setAxActiveIndex.bind(this, {
        selector: METALIST_ITEMS.CSAT.STAR_RATING_WRAPPER.SELECTOR
      });

      return (
        <div
          className={starRatingClasses}
          tabIndex="0"
          data-label={dataLabels.starRatingWrapper}
          onClick={_setAxActiveIndex}
          onFocus={_setAxActiveIndex}
          onKeyDown={this._onKeyDown}>
          {this._renderStars()}
        </div>
      );
    },

    /**
     * Render stars group
     */
    _renderStars() {
      const {starCount} = this.props;
      const starElements = [];

      for (let idx = 1; idx <= starCount; idx++) {
        starElements.push(this._renderStar(idx));
      }

      return starElements;
    },

    /**
     * Render star icon
     */
    _renderStar(idx) {
      const {value, editing} = this.props;
      const {hoverValue} = this.state;
      const activeStarValue = (editing && hoverValue) || value;
      const title = idx === 1 ? "1 star" : `${idx} stars`;

      const active = activeStarValue >= idx;
      const starIconClasses = classes("ion-star", {
        "hs-star-rating__active-icon": active,
        "hs-star-rating__icon": !active
      });

      return (
        <i
          className={starIconClasses}
          title={title}
          onMouseEnter={this._onStarMouseEnter.bind(this, idx)}
          onMouseLeave={this._onStarMouseLeave}
          key={idx}
          onClick={this._onStarClick.bind(this, idx)}
          role="button"
        />
      );
    },

    /**
     * This function is called on focus or click event on element
     * It calls ax function to update active index
     *
     * @param {Object} config.selector - Selector value
     */
    _setAxActiveIndex(config) {
      ax.setActiveIndex(config);
    },

    /**
     * Decrease/ Increase star rating value on left/right arrow click
     *
     * @param {Object} ev - event on star wrapper
     */
    _onKeyDown(ev) {
      const {value, onSelectStarRating, onUpdateStarRating} = this.props;
      const {SPACE, ENTER, RIGHT_ARROW, LEFT_ARROW} = KEY_CODES;
      const {keyCode} = ev;

      if (keyCode === LEFT_ARROW && value > 1) {
        onUpdateStarRating(value - 1);
      } else if (keyCode === RIGHT_ARROW && value < 5) {
        onUpdateStarRating(value + 1);
      } else if ((keyCode === SPACE || keyCode === ENTER) && onSelectStarRating) {
        onSelectStarRating();
      }
    },

    /**
     * Handler for mouse enter event.
     */
    _onStarMouseEnter(val) {
      this._updateHoverValue(val);
    },

    /**
     * Handler for mouse leave event.
     */
    _onStarMouseLeave() {
      this._updateHoverValue(0);
    },

    /**
     * Update hover value.
     */
    _updateHoverValue(value) {
      this.setState({
        hoverValue: value
      });
    },

    /**
     * Click handler for star.
     */
    _onStarClick(index) {
      const {onStarClick, editing} = this.props;

      if (!editing) {
        return;
      }
      if (onStarClick) {
        onStarClick(index);
      }
    }
  });
});
