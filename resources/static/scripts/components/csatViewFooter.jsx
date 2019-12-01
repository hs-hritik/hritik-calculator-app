/**
 * Renders footer of CSAT View
 * @author Ayush Sachdeva <ayush.sachdeva@helpshift.com>
 * @created Nov 13, 2019
 */

define (
  "components/csatViewFooter",
  [
    "gunpowder/utils/classes",
    "constants/accessibility"
  ],
  function (classes, axConstants) {
    "use strict";

    const {METALIST_ITEMS} = axConstants;

    const CsatViewFooter = ({
      rating,
      csatSaveInProgress,
      allowFullScreen,
      submitBtnText,
      onSubmitCsat,
      setAxActiveIndex
    }) => {
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

      const _setAxActiveIndex = setAxActiveIndex.bind (
        null, {
          selector: METALIST_ITEMS.CSAT.FOOTER_BTN.SELECTOR
        }
      );

      return (
        <div className={footerClasses}>
          <div className="hs-footer__vertical-items-wrapper">
            <button
              className={btnClasses}
              onClick={onSubmitCsat}
              disabled={btnDisabled}
              tabIndex="0"
              data-label={METALIST_ITEMS.CSAT.FOOTER_BTN.DATA_LABEL}
              onFocus={_setAxActiveIndex}
              aria-label={submitBtnText}>
              {submitBtnText}
            </button>
          </div>
        </div>
      );
    };

    CsatViewFooter.propTypes = {
      rating: PropTypes.number.isRequired,
      csatSaveInProgress: PropTypes.bool,
      allowFullScreen: PropTypes.bool,
      submitBtnText: PropTypes.string.isRequired,
      onSubmitCsat: PropTypes.func.isRequired,
      setAxActiveIndex: PropTypes.func.isRequired
    };

    return CsatViewFooter;
  }
);