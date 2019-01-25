/**
 * Picker component used as input element with bots
 * @author Nachiket Kakatkar <nachiket@helpshift.com>
 * @created Jan 22, 2019
 */

 /**
  * This component renders a list of options along with a header which has a
  * search input. The search query will be used to filter the options that are
  * rendered in the list.
  * The "options" are required to be passed as props. The options list is not
  * stored in the state. The value received from props is filtered before
  * rendering.
  * The "closed" value is controlled. The parent component needs to handle the
  * onToggle callback and update the value of "closed" in its local state.
  * The change in the value of "closed" can be triggered by the following:
  * 1. In closed state, when user clicks the toggle button (chevron-up)
  * 2. In closed state, when user clicks the header label
  * 3. In closed state, @TODO: Add scroll trigger explaination.
  * 4. In opened state, when user clicks the toggle button (chevron-down)
  */

define (
  "components/picker",
  [
    "utils/classes"
  ],
  function (classes) {
    "use strict";

    const {PropTypes} = React;

    /**
     * Component to render the list of options
     */
    const OptionsList = React.createClass ({
      displayName: "OptionsList",
      propTypes: {
        /**
         * Options of the list
         */
        options: PropTypes.arrayOf (PropTypes.shape ({
          /**
           * Unique id for the option
           */
          value: PropTypes.string.isRequired,

          /**
           * Title of the option
           */
          title: PropTypes.string.isRequired,

          /**
           * Description of the option
           */
          description: PropTypes.string,

          /**
           * Icon to be shown for the option
           */
          iconUrl: PropTypes.string
        })).isRequired,

        /**
         * Callback when an option is selected
         */
        onSelect: PropTypes.func.isRequired
      },

      render () {
        // @TODO: Flesh this out.
        return (
          <ul className="hs-picker-options" />
        );
      }
    });

    /**
     * Component having collapse/open/back button & search bar
     */
    const PickerHeader = React.createClass ({
      displayName: "PickerHeader",
      propTypes: {
        /**
         * Placeholder for the search input
         */
        placeholder: PropTypes.string.isRequired,

        /**
         * Callback when query changes
         */
        onSearch: PropTypes.func.isRequired,

        /**
         * Label for the header
         */
        label: PropTypes.string.isRequired,

        /**
         * Whether the picker is closed or not
         */
        closed: PropTypes.bool.isRequired,

        /**
         * Handler for click on toggle button
         */
        onToggleButtonClick: PropTypes.func
      },
      getInitialState () {
        return {
          query: "",
          searchInputIsShown: false
        };
      },

      render () {
        const {
          searchInputIsShown
        } = this.state;

        let actionBtnIconEl;
        if (searchInputIsShown) {
          actionBtnIconEl = this._renderCloseSearchIcon ();
        } else {
          actionBtnIconEl = this._renderToggleIcon ();
        }

        return (
          <div className="hs-picker-header">
            <button className="hs-picker-header__action-button">
              {actionBtnIconEl}
            </button>
            {this._renderSearch ()}
          </div>
        );
      },

      _renderCloseSearchIcon () {
        const btnIconClasses = classes (
          "hs-picker-header__close-search-icon",
          "ion-arrow-left"
        );

        return (
          <i className={btnIconClasses}
             onClick={this._onCloseSearchClick} />
        );
      },

      _renderToggleIcon () {
        const {
          closed,
          onToggleButtonClick
        } = this.props;

        const iconClasses = classes (
          "hs-picker-header__toggle-icon",
          {
            "ion-chevron-down": !closed,
            "ion-chevron-up": closed
          }
        );

        return (
          <i className={iconClasses}
             onClick={onToggleButtonClick} />
        );
      },

      _renderSearch () {
        const {
          searchInputIsShown
        } = this.state;

        let searchEl;

        if (searchInputIsShown) {
          searchEl = this._renderSearchInput ();
        } else {
          const {
            label
          } = this.props;

          searchEl = (
            <div className="hs-picker-header__search-label">
              {label}
            </div>
          );
        }

        return (
          <div>
            {searchEl}
            <i className="ion-magnifier"
               onClick={this._onSearchIconClick} />
          </div>
        );
      },

      _renderSearchInput () {
        const {
          query
        } = this.state;

        const {
          placeholder
        } = this.props;

        return (
          <div className="hs-picker-header__input-wrapper">
            <input value={query}
                   placeholder={placeholder}
                   onChange={this._onSearchQueryChange} />
          </div>
        );
      },

      /**
       * Handle click on the search icon
       */
      _onSearchIconClick () {
        this.setState ({
          searchInputIsShown: true
        });
      },

      /**
       * Handle click on close search button
       */
      _onCloseSearchButtonClick () {
        this.setState ({
          searchInputIsShown: false
        });
      },

      /**
       * Handle change in search query
       */
      _onSearchQueryChange (ev) {
        this.props.onSearch (ev.target.value);
      }
    });

    return React.createClass ({
      displayName: "Picker",
      propTypes: {
        /**
         * Whether the picker is closed or not
         */
        closed: PropTypes.bool.isRequired,

        /**
         * Handler when the closed state is toggled
         */
        onToggle: PropTypes.func.isRequired
      },

      render () {
        // @TODO: Implement list render logic
        return (
          <div className="hs-picker">
            <PickerHeader />
            <div className="hs-picker__options-container">
              <OptionsList />
            </div>
          </div>
        );
      }
    });
  }
);