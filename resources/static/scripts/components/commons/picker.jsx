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
    "gunpowder/utils/classes",
    "constants/keyCodes",
    "helpers/dom",
    "utils/browser"
  ],
  function (classes, KEY_CODES, domHelpers, browserUtils) {
    "use strict";

    const {PropTypes} = React;

    const WHEEL_END_EVENT_TIMEOUT = 450; // ms

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
        onSelect: PropTypes.func.isRequired,

        /**
         * Highlighted option index
         */
        highlightedIndex: PropTypes.number,

        /**
         * Handler for mouse enter event on option
         */
        onOptionItemMouseEnter: PropTypes.func.isRequired
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
          options,
          highlightedIndex
        } = this.props;

        return options.map ((option, index) => {
          const optionItemClasses = classes (
            "hs-picker-options__option-item",
            {
              "hs-picker-options__option-item-highlighted": (
                index === highlightedIndex
              )
            }
          );

          return (
            <li className={optionItemClasses}
                key={option.value}
                onClick={this._onOptionClick.bind (this, option)}
                onMouseEnter={this._onOptionItemMouseEnter.bind (this, index)}>
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
      },

      /**
       * Handle mouse-enter on individual list item
       */
      _onOptionItemMouseEnter (index) {
        this.props.onOptionItemMouseEnter (index);
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
        onLabelClick: PropTypes.func,

        /**
         * Handler for keydown even on search input
         */
        onSearchInputKeyDown: PropTypes.func
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
          "hs-picker-header__close-search-icon",
          "ion-arrow-thin-left"
        );

        return (
          <i className={btnIconClasses}
             onClick={this._onCloseSearchIconClick} />
        );
      },

      _renderToggleIcon () {
        // Use chevron-right and it will have transform:rotate
        // based on the state of the widget.
        const iconClasses = classes (
          "hs-picker-header__toggle-icon",
          "ion-chevron-right"
        );

        return (
          <i className={iconClasses}
             onClick={this.props.onToggleButtonClick} />
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
                   onChange={this._onSearchQueryChange}
                   onKeyDown={this._onSearchInputKeyDown} />
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
        this._resetSearch ();
      },

      /**
       * Handle change in search query
       */
      _onSearchQueryChange (ev) {
        const query = ev.target.value;

        this.setState ({
          query
        });

        this.props.onSearch (query);
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
      },

      /**
       * Handler for keydown event on search input
       * @param {Object} ev - Event object
       */
      _onSearchInputKeyDown (ev) {
        if (ev.keyCode === KEY_CODES.ESCAPE) {
          this._resetSearch ();
        }

        this.props.onSearchInputKeyDown (ev);
      },

      /**
       * Hides the search input, sets the search query to empty and
       * triggers onSearch with empty value.
       */
      _resetSearch () {
        this.setState ({
          searchInputIsShown: false,
          query: ""
        });

        this.props.onSearch ("");
      }
    });

    return React.createClass ({
      displayName: "Picker",
      propTypes: {
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
        onSelect: PropTypes.func,

        /**
         * Minimum height of the widget
         */
        minHeight: PropTypes.number.isRequired,

        /**
         * Maximum height the widget can have
         */
        maxHeight: PropTypes.number.isRequired
      },
      getInitialState () {
        return {
          closed: true,
          query: "",
          filteredOptions: this.props.options,
          highlightedIndex: -1,
          height: this.props.minHeight
        };
      },

      render () {
        const {
          closed,
          height
        } = this.state;

        const {
          searchPlaceholder: placeholder,
          headerLabel: label,
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

        const style = {
          maxHeight: height
        };

        let touchEventsHandlers = {};
        if (browserUtils.areTouchEventsSupported ()) {
          touchEventsHandlers = {
            onTouchStart: this._onTouchStart,
            onTouchMove: this._onTouchMove,
            onTouchEnd: this._onTouchEnd
          };
        }

        return (
          <div className={pickerClasses}
               {...touchEventsHandlers}
               onWheel={this._onWheel}
               style={style}>
            <div className="hs-picker__header-wrapper">
              <PickerHeader placeholder={placeholder}
                            label={label}
                            closed={closed}
                            onSearch={this._onSearch}
                            onToggleButtonClick={this._onHeaderToggleButtonClick}
                            onLabelClick={this._onHeaderLabelClick}
                            onSearchInputKeyDown={this._onSearchInputKeyDown} />
            </div>
            {this._renderOptionsList ()}
          </div>
        );
      },

      _renderOptionsList () {
        const {
          highlightedIndex,
          filteredOptions
        } = this.state;

        let optionsListEl;

        if (filteredOptions.length) {
          optionsListEl = (
            <OptionsList options={filteredOptions}
                         onSelect={this._onOptionSelect}
                         highlightedIndex={highlightedIndex}
                         onOptionItemMouseEnter={this._onOptionItemMouseEnter} />
          );
        } else {
          optionsListEl = (
            <div className="hs-picker__no-search-results">
              {this.props.searchNoResultsText}
            </div>
          );
        }

        return (
          <div className="hs-picker__options-wrapper"
               ref={this._saveOptionsWrapperRef}>
            {optionsListEl}
          </div>
        );
      },

      /**
       * Ref of the options wrapper div
       */
      _optionsWrapperRef: null,

      /**
       * Saves the ref for options wrapper div
       * @param {Object} ref  - Ref of the options wrapper
       */
      _saveOptionsWrapperRef (ref) {
        this._optionsWrapperRef = ref;
      },

      /**
       * Reference to the touch events from touch start & touch move events
       */
      _touchEv: null,

      /**
       * Handle change in search query
       * @param {String} query - Search query
       */
      _onSearch (query) {
        // Reset the highlightedIndex to 0 because the list of options
        // is going to change
        this.setState ({
          query,
          filteredOptions: this._filterOptions (this.props.options, query),
          highlightedIndex: 0
        });
      },

      /**
       * Handle click on search toggle button
       */
      _onHeaderToggleButtonClick () {
        const updatedClosedStateValue = !this.state.closed;

        this._updateToggleStateAndTriggerChange (updatedClosedStateValue);

        // If the widget was toggled to closed state, remove the highlighting
        if (updatedClosedStateValue) {
          this.setState ({
            highlightedIndex: -1
          });
        }
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
          this._updateToggleStateAndTriggerChange (true);
        }

        if (onSelect) {
          onSelect (option);
        }
      },

      /**
       * Handler for mouse enter event on option
       * @param {Number} optionIndex - index of option on which event occurred
       */
      _onOptionItemMouseEnter (optionIndex) {
        if (this.state.closed) {
          return;
        }

        this.setState ({
          highlightedIndex: optionIndex
        });
      },

      /**
       * Handler for keydown on search input
       * @param {Object}} ev - Event object
       */
      _onSearchInputKeyDown (ev) {
        const {
          filteredOptions,
          highlightedIndex
        } = this.state;
        const optionsLen = filteredOptions.length;

        // Do nothing if the list is empty
        if (!optionsLen) {
          return;
        }

        switch (ev.keyCode) {
          case KEY_CODES.ENTER:
            const {onSelect} = this.props;

            this._updateToggleStateAndTriggerChange (true);

            if (onSelect) {
              onSelect (filteredOptions [highlightedIndex]);
            }
            break;

          case KEY_CODES.UP_ARROW:
            let newHighlightedIndex = highlightedIndex - 1;

            if (newHighlightedIndex < 0) {
              newHighlightedIndex = optionsLen - 1;
            }

            this.setState ({
              highlightedIndex: newHighlightedIndex
            }, () => {
              this._scrollOptionIntoView ();
            });
            break;

          case KEY_CODES.DOWN_ARROW:
            this.setState ({
              highlightedIndex: (highlightedIndex + 1) % optionsLen
            }, () => {
              this._scrollOptionIntoView ();
            });
            break;
        }
      },

      /**
       * Handle touch start event. Saves the TouchEvent ref which can be used in
       * subsequent touch move events to calculate the change in height.
       * @param {Object} - Event object
       */
      _onTouchStart (ev) {
        if (!this.state.closed) {
          return;
        }

        this._touchEv = ev.changedTouches [0];
      },

      /**
       * Handle touch move event. Calculates the change in height using the ref
       * stored from previous touch move events or touch start event.
       * @param {Object} - Event object
       */
      _onTouchMove (ev) {
        if (!this.state.closed) {
          return;
        }

        const touchEv = ev.changedTouches [0];
        const changeInHeight = Math.round (touchEv.clientY - this._touchEv.clientY);
        this._touchEv = touchEv;

        this._updateHeight (this.state.height - changeInHeight);
      },

      /**
       * Handle touch end event. This event indicates the intent to finish resizing
       * of the picker. Based on the current height of the widget, it will snap
       * the value of the height to minimum or maximum.
       */
      _onTouchEnd () {
        if (!this.state.closed) {
          return;
        }

        this._completeResize ();
      },

      /**
       * Ref to the timeout used for keeping track of wheel events end
       */
      _onWheelTimer: null,

      /**
       * Handles the onWheel event.
       * NOTE: We do not get a wheel-end event. To detect this, we start a
       * timeout every time the handler is called. If the next wheel event does
       * not come in the timeout interval, we infer that the wheel event has
       * been stopped. When the wheel event stops, we snap the height
       * to min or max if the widget is not already in open state.
       * @param {Object} ev - The WheelEvent object
       */
      _onWheel (ev) {
        if (!this.state.closed) {
          return;
        }

        this._updateHeight (ev.deltaY + this.state.height);

        if (this._onWheelTimer) {
          window.clearTimeout (this._onWheelTimer);
          this._onWheelTimer = null;
        }

        this._onWheelTimer = window.setTimeout (() => {
          this._onWheelTimer = null;
          if (!this.state.closed) {
            return;
          }

          this._completeResize ();
        }, WHEEL_END_EVENT_TIMEOUT);
      },

      /**
       * Updates the height value in the state with given value. If the value
       * is greater than max possible height, then it will set it to max allowed
       * height and trigger onToggle.
       * @param {Number} newHeight - The new value of height
       */
      _updateHeight (newHeight) {
        const {
          minHeight,
          maxHeight
        } = this.props;

        if (newHeight >= maxHeight) {
          newHeight = maxHeight;
        } else if (newHeight <= minHeight) {
          newHeight = minHeight;
        }

        this.setState ({
          height: newHeight
        });

        // If the new value of height is same as max allowed value and if
        // the widget is in closed state, then set the closed state to false and
        // trigger onToggle
        if (newHeight === maxHeight) {
          this._updateToggleStateAndTriggerChange (false);
        }
      },

      /**
       * Snaps the height of the widget to either minimum or maximum based on
       * the current value of the height in state. If the current height is more
       * than the minimum height, it sets the height to maximum height. Otherwise,
       * it sets it to the minimum height.
       */
      _completeResize () {
        const {
          minHeight,
          maxHeight
        } = this.props;

        const {
          height: currentHeight
        } = this.state;

        const newHeight = (currentHeight > minHeight) ? maxHeight : minHeight;

        if (currentHeight !== newHeight) {
          this.setState ({
            height: newHeight
          });

          // If the new value of height is same as max allowed value and if
          // the widget is in closed state, then set the closed state to false and
          // trigger onToggle
          if (newHeight === maxHeight) {
            this._updateToggleStateAndTriggerChange (false);
          }
        }
      },

      /**
       * Scrolls the highlighted option into view
       */
      _scrollOptionIntoView () {
        if (this._optionsWrapperRef) {
          const wrapper = ReactDOM.findDOMNode (this._optionsWrapperRef);

          if (!this.state.highlightedIndex) {
            wrapper.scrollTop = 0;
          } else {
            const li = wrapper.querySelector (".hs-picker-options__option-item-highlighted");
            domHelpers.scrollIntoView (wrapper, li);
          }
        }
      },

      /**
       * Updates the value of closed flag and triggers onToggle passed
       * in props.
       * @param closed {Boolean} - Whether the picker is closed
       */
      _updateToggleStateAndTriggerChange (closed) {
        if (closed === this.state.closed) {
          return;
        }

        const {
          onToggle,
          minHeight,
          maxHeight
        } = this.props;

        this.setState ({
          closed,
          height: closed ? minHeight : maxHeight
        });

        if (onToggle) {
          onToggle (closed);
        }
      },

      /**
       * Filters the options list using the query provided according to the
       * following alogrithm:
       * * At the top results of prefix search for title will show
       * * Below that results of substring search for title will show
       * * Below that results of prefix search for description (if present) will
       * show
       * * Below that results of substring search for description (if present)
       * will show
       * @param {Array} options - Array of options
       * @param {String} query - Query to be used for filtering
       * @return {Array} - Filtered list of options
       */
      _filterOptions (options, query) {
        if (query) {
          query = query.trim ();
        }

        if (!query) {
          return options;
        }

        const titlePrefixResults = [];
        const titleSubStrResults = [];
        const descPrefixResults = [];
        const descSubStrResults = [];

        options.forEach ((optionItem) => {
          const {
            label: title,
            description: desc
          } = optionItem;

          const lowerCaseQuery = query.toLowerCase ();

          const indexInTitle = title.toLowerCase ().indexOf (lowerCaseQuery);

          if (indexInTitle === 0) {
            titlePrefixResults.push (optionItem);
          } else if (indexInTitle > 0) {
            titleSubStrResults.push (optionItem);
          } else if (desc) {
            const indexInDesc = desc.toLowerCase ().indexOf (lowerCaseQuery);

            if (indexInDesc === 0) {
              descPrefixResults.push (optionItem);
            } else if (indexInDesc > 0) {
              descSubStrResults.push (optionItem);
            }
          }
        });

        return [
          ...titlePrefixResults,
          ...titleSubStrResults,
          ...descPrefixResults,
          ...descSubStrResults
        ];
      },

      componentWillReceiveProps (nextProps) {
        // @TODO: Optimize this to check for diff in options
        const filteredOptions = this._filterOptions (
          nextProps.options, this.state.query
        );

        this.setState ({
          filteredOptions
        });
      },

      componentDidUpdate (prevProps, prevState) {
        // Scroll to top if the picker goes from open to closed state.
        if (!prevState.closed && this.state.closed && this._optionsWrapperRef) {
          const node = ReactDOM.findDOMNode (this._optionsWrapperRef);
          node.scrollTop = 0;
        }
      }
    });
  }
);