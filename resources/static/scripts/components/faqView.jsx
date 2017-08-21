/**
 * Component for the FAQ view.
 * Renders an FAQ's header, body, and footer.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created June 14, 2017
 */

define ("components/faqView",
  [
    "gunpowder/utils/classes",
    "components/commons/viewHeader",
    "components/commons/branding"
  ],
  function (classes, ViewHeader, Branding) {
    "use strict";

    const {PropTypes} = React;

    return React.createClass ({
      displayName: "FaqView",
      propTypes: {
        title: PropTypes.string.isRequired,
        body: PropTypes.string.isRequired,
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
              <Branding text={text} />
            </div>
          </div>
        );
        /* eslint-enable react/no-danger */
      }
    });

  }
);