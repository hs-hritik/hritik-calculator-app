/**
 * Renders body of CSAT view
 * @author Ayush Sachdeva <ayush.sachdeva@helpshift.com>
 * @created Nov 13, 2019
 */

define("components/csatViewBody", ["components/starRating", "constants/accessibility"], function(
  StarRating,
  axConstants
) {
  "use strict";

  const {METALIST_ITEMS} = axConstants;

  const CsatViewBody = ({
    csatBotRequestMsg,
    csatBotReviewPlaceholder,
    rating,
    review,
    csatSaveInProgress,
    onCsatReviewChange,
    onStarClick,
    setAxActiveIndex,
    onUpdateStarRating
  }) => {
    const _setTextAreaAxActiveIndex = setAxActiveIndex.bind(null, {
      selector: METALIST_ITEMS.CSAT.FEEDBACK_TEXT_AREA.SELECTOR
    });
    const starRatingDataLabels = {
      starRatingWrapper: METALIST_ITEMS.CSAT.STAR_RATING_WRAPPER.DATA_LABEL
    };

    return (
      <div className="hs-csat__form">
        <div className="hs-csat__form-item">
          <h3 className="hs-csat__heading">{csatBotRequestMsg}</h3>
        </div>
        <div className="hs-csat__form-item">
          <StarRating
            name="csat"
            editing={!csatSaveInProgress}
            value={rating}
            onStarClick={onStarClick}
            dataLabels={starRatingDataLabels}
            onUpdateStarRating={onUpdateStarRating}
          />
        </div>
        <div className="hs-csat__form-item">
          <textarea
            value={review}
            dir="auto"
            disabled={csatSaveInProgress}
            className="hs-csat__input"
            onChange={onCsatReviewChange}
            placeholder={csatBotReviewPlaceholder}
            tabIndex="0"
            data-label={METALIST_ITEMS.CSAT.FEEDBACK_TEXT_AREA.DATA_LABEL}
            onFocus={_setTextAreaAxActiveIndex}
            onClick={_setTextAreaAxActiveIndex}
            aria-label={csatBotRequestMsg}
          />
        </div>
      </div>
    );
  };

  CsatViewBody.propTypes = {
    csatBotRequestMsg: PropTypes.string.isRequired,
    csatBotReviewPlaceholder: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    review: PropTypes.string,
    csatSaveInProgress: PropTypes.bool,
    onCsatReviewChange: PropTypes.func.isRequired,
    onStarClick: PropTypes.func.isRequired,
    setAxActiveIndex: PropTypes.func.isRequired,
    onUpdateStarRating: PropTypes.func
  };

  return CsatViewBody;
});
