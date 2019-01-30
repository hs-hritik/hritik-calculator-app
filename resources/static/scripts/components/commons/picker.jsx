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
  "components/commons/picker",
  [
    "gunpowder/utils/classes"
  ],
  function (classes) {
    "use strict";

    const {PropTypes} = React;

    const optionsPropType = PropTypes.arrayOf (PropTypes.shape ({
      /**
       * Unique id for the option
       */
      value: PropTypes.string.isRequired,

      /**
       * Title of the option
       */
      label: PropTypes.string.isRequired,

      /**
       * Description of the option
       */
      description: PropTypes.string,

      /**
       * Icon to be shown for the option
       */
      iconUrl: PropTypes.string
    }));

    /**
     * Component to render the list of options
     */
    const OptionsList = React.createClass ({
      displayName: "OptionsList",
      propTypes: {
        /**
         * Options of the list
         */
        options: optionsPropType.isRequired,

        /**
         * Callback when an option is selected
         */
        onSelect: PropTypes.func.isRequired
      },

      render () {
        return (
          <ul className="hs-picker-options">
            {this._renderListItems ()}
          </ul>
        );
      },

      _renderListItems () {
        const {
          options
        } = this.props;

        return options.map ((option) => {
          return (
            <li className="hs-picker-options__option-item"
                key={option.value}
                onClick={this._onOptionClick.bind (this, option)}>
              {option.label}
            </li>
          );
        });
      },

      /**
       * Handle click on individual list item
       * @param {Object} optionValue - option that was clicked
       */
      _onOptionClick (optionValue) {
        this.props.onSelect (optionValue);
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
        onToggleButtonClick: PropTypes.func,

        /**
         * Handler for click on the label
         */
        onLabelClick: PropTypes.func
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

        const {
          closed
        } = this.props;

        let actionBtnEl;
        if (searchInputIsShown) {
          actionBtnEl = this._renderCloseSearchIcon ();
        } else {
          actionBtnEl = this._renderToggleIcon ();
        }

        const headerClasses = classes (
          "hs-picker-header",
          {
            "hs-picker-header--closed": closed,
            "hs-picker-header--opened": !closed
          }
        );

        return (
          <div className={headerClasses}>
            {actionBtnEl}
            {this._renderSearch ()}
          </div>
        );
      },

      _renderCloseSearchIcon () {
        const btnIconClasses = classes (
          "hs-picker-header__action-icon",
          "ion-arrow-thin-left"
        );

        return (
          <i className={btnIconClasses}
             onClick={this._onCloseSearchIconClick} />
        );
      },

      _renderToggleIcon () {
        const {
          closed,
          onToggleButtonClick
        } = this.props;

        // TODO: Fix icons. Using these until we add the required icons
        // "ion-chevron-down": !closed,
        // "ion-chevron-up": closed
        const iconClasses = classes (
          "hs-picker-header__action-icon",
          {
            "ion-alert-circled": !closed,
            "ion-attachment": closed
          }
        );

        return (
          <i className={iconClasses}
             onClick={onToggleButtonClick} />
        );
      },

      _renderSearch () {
        const {
          closed
        } = this.props;
        const {
          searchInputIsShown
        } = this.state;

        let searchEl;
        let searchIconEl = null;

        if (searchInputIsShown) {
          searchEl = this._renderSearchInput ();
        } else {
          const {
            label
          } = this.props;

          searchEl = (
            <small className="hs-picker-header__search-label"
                   onClick={this._onLabelClick}>
              {label}
            </small>
          );

          if (!closed) {
            searchIconEl = (
              <i className="hs-picker-header__search-icon ion-magnifier"
                 onClick={this._onSearchIconClick} />
            );
          }
        }

        return (
          <div className="hs-picker-header__search-wrapper">
            {searchEl}
            {searchIconEl}
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
            <input className="hs-picker-header__input"
                   autoFocus
                   value={query}
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
      _onCloseSearchIconClick () {
        this.setState ({
          searchInputIsShown: false
        });
      },

      /**
       * Handle change in search query
       */
      _onSearchQueryChange (ev) {
        this.props.onSearch (ev.target.value);
      },

      /**
       * Handle click on the header label
       */
      _onLabelClick () {
        const {
          onLabelClick
        } = this.props;

        this.setState ({
          searchInputIsShown: true
        });

        if (onLabelClick) {
          onLabelClick ();
        }
      }
    });

    return React.createClass ({
      displayName: "Picker",
      propTypes: {
        /**
         * Whether the picker is closed or not
         */
        closed: PropTypes.bool,

        /**
         * Handler when the closed state is toggled
         */
        onToggle: PropTypes.func,

        /**
         * Options of the list
         */
        options: optionsPropType.isRequired,

        /**
         * Placeholder for the search input
         */
        searchPlaceholder: PropTypes.string.isRequired,

        /**
         * Label for the header
         */
        headerLabel: PropTypes.string.isRequired,

        /**
         * Text shown when search query doesn't match any option
         */
        searchNoResultsText: PropTypes.string.isRequired,

        /**
         * Custmom classes for the picker
         */
        className: PropTypes.string,

        /**
         * Handler for option selection
         */
        onSelect: PropTypes.func
      },
      getInitialState () {
        return {
          closed: true
        };
      },

      render () {
        const {
          closed
        } = this.state;

        const {
          searchPlaceholder: placeholder,
          headerLabel: label,
          options,
          className
        } = this.props;

        const pickerClasses = classes (
          className,
          "hs-picker",
          {
            "hs-picker--opened": !closed,
            "hs-picker--closed": closed
          }
        );

        return (
          <div className={pickerClasses}>
            <div className="hs-picker__header-wrapper">
              <PickerHeader placeholder={placeholder}
                            label={label}
                            closed={closed}
                            onSearch={this._onSearch}
                            onToggleButtonClick={this._onHeaderToggleButtonClick}
                            onLabelClick={this._onHeaderLabelClick} />
            </div>

            <div className="hs-picker__options-wrapper">
              <OptionsList options={options}
                           onSelect={this._onOptionSelect} />
            </div>
          </div>
        );
      },

      /**
       * Handle change in search query
       */
      _onSearch () {
        // @TODO: Implement filtering
      },

      /**
       * Handle click on search toggle button
       */
      _onHeaderToggleButtonClick () {
        const {
          closed
        } = this.state;

        this._updateToggleStateAndTriggerChange (!closed);
      },

      /**
       * Handle click on header label
       */
      _onHeaderLabelClick () {
        const {
          closed
        } = this.state;

        if (closed) {
          this._updateToggleStateAndTriggerChange (false);
        }
      },

      /**
       * Handle option selection
       * @param {Object} option - The option that was selected
       */
      _onOptionSelect (option) {
        const {
          onSelect
        } = this.props;

        if (!this.state.closed) {
          this._updateClosedAndTriggerOnToggle (true);
        }

        if (onSelect) {
          onSelect (option);
        }
      },

      /**
       * Updates the value of closed flag and triggers onToggle passed
       * in props.
       * @param closed {Boolean} - Whether the picker is closed
       */
      _updateToggleStateAndTriggerChange (closed) {
        const {
          onToggle
        } = this.props;

        this.setState ({
          closed
        });

        if (onToggle) {
          onToggle (closed);
        }
      }
    });
  }
);