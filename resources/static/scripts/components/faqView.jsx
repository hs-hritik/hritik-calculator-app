/**
 * Component for the FAQ view.
 * Renders an FAQ's header, body, and footer.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created June 14, 2017
 */

define ("components/faqView",
  [
    "gunpowder/utils/classes",
    "components/commons/viewHeader"
  ],
  function (classes, ViewHeader) {
    "use strict";

    const PropTypes = React.PropTypes;

    /*
    const FaqViewFooter = React.createClass ({
      displayName: "FaqViewFooter",
      propTypes: {
        text: PropTypes.shape ({
          faqFooter: PropTypes.string.isRequired,
          faqFooterHelpfulBtn: PropTypes.string.isRequired,
          faqFooterNotHelpfulBtn: PropTypes.string.isRequired
        }).isRequired,
        onFeedbackClick: PropTypes.func.isRequired
      },

      render () {
        const {text, onFeedbackClick} = this.props;
        const btnClasses = classes ("hs-button",
                                    "hs-button--hollow",
                                    "hs-button--no-border",
                                    "hs-button--xx-small");

        return (
          <div className="hs-footer">
            <div className="hs-faq-footer">
              <div>{text.faqFooter}</div>
              <div>
                <button className={btnClasses}
                        onClick={onFeedbackClick.bind (this, "yes")}>
                  {text.faqFooterHelpfulBtn}
                </button>
                <button className={btnClasses}
                        onClick={onFeedbackClick.bind (this, "no")}>
                  {text.faqFooterNotHelpfulBtn}
                </button>
              </div>
            </div>
          </div>
        );
      }
    });
    */

    return React.createClass ({
      displayName: "FaqView",
      propTypes: {
        title: PropTypes.string.isRequired,
        body: PropTypes.string.isRequired,
        onFaqFeedbackClick: PropTypes.func.isRequired,
        onBackBtnClick: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          faqViewHeader: PropTypes.string.isRequired
        }).isRequired
      },

      render () {
        const {title, body, text, onBackBtnClick} = this.props;

        /* eslint-disable react/no-danger */
        return (
          <div className="hs-view">
            <ViewHeader title={text.faqViewHeader}
                        showBackBtn={true}
                        onBackBtnClick={onBackBtnClick} />
            <div className="hs-view__content">
              <h3>{title}</h3>
              <div dangerouslySetInnerHTML={{__html: body}} />
            </div>
          </div>
        );
        /* eslint-enable react/no-danger */
      }
    });

  }
);