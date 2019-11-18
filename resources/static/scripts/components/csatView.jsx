/**
 * Component for the CSAT view.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 14, 2017
 */

define ("components/csatView",
  [
    "gunpowder/utils/classes",
    "components/commons/viewHeader",
    "components/starRating",
    "components/containers/branding",
    "constants/accessibility",
    "extras/accessibility",
    "constants/activeView"
  ],
  function (classes, ViewHeader, StarRating, BrandingContainer, axConstants, ax,
    activeViewConstants) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {METALIST_ITEMS} = axConstants;

    return React.createClass ({
      displayName: "CsatView",
      propTypes: {
        rating: PropTypes.number.isRequired,
        review: PropTypes.string,
        showCloseButton: PropTypes.bool.isRequired,
        allowFullScreen: PropTypes.bool,
        onMinimizeConversation: PropTypes.func.isRequired,
        onSubmitCsat: PropTypes.func.isRequired,
        onUpdateCsatRating: PropTypes.func.isRequired,
        onUpdateCsatReview: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          csatViewHeader: PropTypes.string.isRequired,
          csatBotRequestMsg: PropTypes.string.isRequired,
          csatBotResponseMsg: PropTypes.string.isRequired,
          csatBotFormSubmitBtn: PropTypes.string.isRequired,
          csatBotReviewPlaceholder: PropTypes.string.isRequired,
          csatBotReviewTitle: PropTypes.string.isRequired
        }).isRequired,
        viewStyles: PropTypes.shape ({
          fontFamily: PropTypes.string
        }),
        csatSaveInProgress: PropTypes.bool,
        onUpdateStarRating: PropTypes.func,
        keyboardInteractionIsActive: PropTypes.bool.isRequired
      },

      render () {
        const {
          text,
          showCloseButton,
          onMinimizeConversation,
          viewStyles,
          keyboardInteractionIsActive
        } = this.props;

        const viewClasses = classes ("hs-view", {
          "outline-hidden": !keyboardInteractionIsActive
        });

        return (
          <div className={viewClasses} style={viewStyles}>
            <ViewHeader title={text.csatViewHeader}
                        showCloseBtn={showCloseButton}
                        onCloseBtnClick={onMinimizeConversation} />
            <div className="hs-view__content">
              <div className="hs-csat">
                {this._renderCsatBody ()}
                <BrandingContainer />
                {this._renderCsatFooter ()}
              </div>
            </div>
          </div>
        );
      },

      /**
       * Render csat body.
       */
      _renderCsatBody () {
        const {
          text,
          rating,
          review,
          csatSaveInProgress,
          onUpdateStarRating
        } = this.props;
        const setTextAreaAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: METALIST_ITEMS.CSAT.FEEDBACK_TEXT_AREA.SELECTOR
          }
        );
        const starRatingDataLabels = {
          starRatingWrapper: METALIST_ITEMS.CSAT.STAR_RATING_WRAPPER.DATA_LABEL
        };

        return (
          <div className="hs-csat__form">
            <div className="hs-csat__form-item">
              <h3 className="hs-csat__heading">
                {text.csatBotRequestMsg}
              </h3>
            </div>
            <div className="hs-csat__form-item">
              <StarRating name="csat"
                          editing={!csatSaveInProgress}
                          value={rating}
                          onStarClick={this._onStarClick}
                          dataLabels={starRatingDataLabels}
                          onUpdateStarRating={onUpdateStarRating} />
            </div>
            <div className="hs-csat__form-item">
              <small className="hs-csat__form-label" aria-hidden="true">
                {text.csatBotReviewTitle}
              </small>
              <textarea value={review}
                        dir="auto"
                        disabled={csatSaveInProgress}
                        className="hs-csat__input"
                        onChange={this._onCsatReviewChange}
                        placeholder={text.csatBotReviewPlaceholder}
                        tabIndex="0"
                        data-label={METALIST_ITEMS.CSAT.FEEDBACK_TEXT_AREA.DATA_LABEL}
                        onFocus={setTextAreaAxActiveIndex}
                        onClick={setTextAreaAxActiveIndex}
                        aria-label={text.csatBotReviewTitle} />
            </div>
          </div>
        );
      },

      /**
       * Render csat footer.
       */
      _renderCsatFooter () {
        const {
          text,
          rating,
          allowFullScreen,
          csatSaveInProgress
        } = this.props;
        const btnClasses = classes (
          "hs-button",
          "hs-footer__btn"
        );
        const btnDisabled = (rating === 0) || csatSaveInProgress;
        const footerClasses = classes ("hs-footer",
          "hs-footer--center-items", {
            "hs-footer--full-screen": allowFullScreen
          }
        );
        const setAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: METALIST_ITEMS.CSAT.FOOTER_BTN.SELECTOR
          }
        );

        return (
          <div className={footerClasses}>
            <div className="hs-footer__vertical-items-wrapper">
              <button className={btnClasses}
                      onClick={this.props.onSubmitCsat}
                      disabled={btnDisabled}
                      tabIndex="0"
                      data-label={METALIST_ITEMS.CSAT.FOOTER_BTN.DATA_LABEL}
                      onFocus={setAxActiveIndex}
                      aria-label={text.csatBotFormSubmitBtn} >
                {text.csatBotFormSubmitBtn}
              </button>
            </div>
          </div>
        );
      },

      /**
       * Csat review change handler.
       */
      _onCsatReviewChange (ev) {
        this.props.onUpdateCsatReview (ev.target.value);
      },

      /**
       * Click handler for star
       * @param {Number} value - star index which is clicked
       */
      _onStarClick (value) {
        this.props.onUpdateCsatRating (value);
      },

      /**
       * This function is called on focus or click event on element
       * It calls ax function to update active index
       *
       * @param {Object} config.selector - Selector value
       */
      _setAxActiveIndex (config) {
        ax.setActiveIndex (config);
      },

      componentDidMount () {
        ax.setActiveView (activeViewConstants.CSAT);
        ax.focus ();
      }
    });
  }
);