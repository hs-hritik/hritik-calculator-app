/**
 * Component for the FAQ view.
 * Renders an FAQ's header, body, and footer.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created June 14, 2017
 */

define ("components/faqView",
  [
    "components/commons/viewHeader",
    "components/commons/branding",
    "components/infoView"
  ],
  function (ViewHeader, Branding, InfoView) {
    "use strict";

    const {PropTypes} = React;

    return React.createClass ({
      displayName: "FaqView",
      propTypes: {
        title: PropTypes.string,
        body: PropTypes.string,
        loading: PropTypes.bool,
        errorMsg: PropTypes.string,
        onBackBtnClick: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          faqViewHeader: PropTypes.string.isRequired
        }).isRequired,
        viewStyles: PropTypes.shape ({
          fontFamily: PropTypes.string
        })
      },

      render () {
        const {text, onBackBtnClick, viewStyles} = this.props;

        return (
          <div className="hs-view" style={viewStyles}>
            <ViewHeader title={text.faqViewHeader}
                        showBackBtn={true}
                        onBackBtnClick={onBackBtnClick} />
            {this._renderViewContents ()}
          </div>
        );
      },

      _renderViewContents () {
        const {title, body, text, loading, errorMsg} = this.props;

        if (loading || errorMsg) {
          return (
            <InfoView loading={loading}
                      title={errorMsg} />
          );
        }

        /* eslint-disable react/no-danger */
        return (
          <div className="hs-view__content">
            <div className="hs-faq" dir="auto">
              <h3 className="hs-faq__title" >{title}</h3>
              <div className="hs-faq__body"
                    dangerouslySetInnerHTML={{__html: body}} />
            </div>
            <Branding text={text} />
          </div>
        );
        /* eslint-enable react/no-danger */
      }
    });
  }
);
