/**
 * Renders body of CSAT view
 * @author Ayush Sachdeva <ayush.sachdeva@helpshift.com>
 * @created Nov 13, 2019
 */

define (
  "components/csatViewBody",
  [
    "components/starRating"
  ],
  function (StarRating) {
    "use strict";

    const CsatViewBody = ({
      csatBotRequestMsg,
      csatBotReviewTitle,
      csatBotReviewPlaceholder,
      rating,
      review,
      csatSaveInProgress,
      onCsatReviewChange,
      onStarClick
    }) => (
      <div className="hs-csat__form">
        <div className="hs-csat__form-item">
          <h3 className="hs-csat__heading">
            {csatBotRequestMsg}
          </h3>
        </div>
        <div className="hs-csat__form-item">
          <StarRating
            name="csat"
            editing={!csatSaveInProgress}
            value={rating}
            onStarClick={onStarClick} />
        </div>
        <div className="hs-csat__form-item">
          <small className="hs-csat__form-label">
            {csatBotReviewTitle}
          </small>
          <textarea
            value={review}
            dir="auto"
            disabled={csatSaveInProgress}
            className="hs-csat__input"
            onChange={onCsatReviewChange}
            placeholder={csatBotReviewPlaceholder} />
        </div>
      </div>
    );

    CsatViewBody.propTypes = {
      csatBotRequestMsg: PropTypes.string.isRequired,
      csatBotReviewTitle: PropTypes.string.isRequired,
      csatBotReviewPlaceholder: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired,
      review: PropTypes.string,
      csatSaveInProgress: PropTypes.bool,
      onCsatReviewChange: PropTypes.func.isRequired,
      onStarClick: PropTypes.func.isRequired
    };

    return CsatViewBody;
  }
);