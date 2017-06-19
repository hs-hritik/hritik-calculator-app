/**
 * Component for the FAQ view.
 * Renders an FAQ's header, body, and footer.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created June 14, 2017
 */

define ("components/faqView",
  [
    "components/commons/viewHeader"
  ],
  function (ViewHeader) {
    "use strict";

    const PropTypes = React.PropTypes;

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
        return (
          <div>
            <div>{text.faqFooter}</div>
            <div>
              <button onClick={onFeedbackClick.bind (this, "yes")}>
                {text.faqFooterHelpfulBtn}
              </button>
              <button onClick={onFeedbackClick.bind (this, "no")}>
                {text.faqFooterNotHelpfulBtn}
              </button>
            </div>
          </div>
        );
      }
    });

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
        const {title, body, text, onFaqFeedbackClick, onBackBtnClick} = this.props;

        /* eslint-disable react/no-danger */
        return (
          <div>
            <ViewHeader title={text.faqViewHeader}
                        showBackBtn={true}
                        onBackBtnClick={onBackBtnClick} />
            <div>{title}</div>
            <div dangerouslySetInnerHTML={{__html: body}} />
            <FaqViewFooter text={text}
                           onFeedbackClick={onFaqFeedbackClick} />
          </div>
        );
        /* eslint-enable react/no-danger */
      }
    });

  }
);