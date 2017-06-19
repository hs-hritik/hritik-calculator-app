/**
 * Component for the FAQ view.
 * Renders an FAQ's header, body, and footer.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created June 14, 2017
 */

define ("components/faqView",
  [],
  function () {
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
        text: PropTypes.object.isRequired,
        onFaqFeedbackClick: PropTypes.func.isRequired
      },

      render () {
        const {title, body, text, onFaqFeedbackClick} = this.props;

        /* eslint-disable react/no-danger */
        return (
          <div>
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