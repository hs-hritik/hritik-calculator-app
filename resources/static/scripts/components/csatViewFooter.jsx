/**
 * Renders footer of CSAT View
 * @author Ayush Sachdeva <ayush.sachdeva@helpshift.com>
 * @created Nov 13, 2019
 */

define (
  "components/csatViewFooter",
  [
    "gunpowder/utils/classes"
  ],
  function (classes) {
    "use strict";

    const CsatViewFooter = ({
      rating,
      csatSaveInProgress,
      allowFullScreen,
      submitBtnText,
      onSubmitCsat
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

      return (
        <div className={footerClasses}>
          <div className="hs-footer__vertical-items-wrapper">
            <button
              className={btnClasses}
              onClick={onSubmitCsat}
              disabled={btnDisabled} >
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
      onSubmitCsat: PropTypes.func.isRequired
    };

    return CsatViewFooter;
  }
);