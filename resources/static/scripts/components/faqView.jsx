/**
 * Component for the FAQ view.
 * Renders an FAQ's header, body, and footer.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created June 14, 2017
 */

define ("components/faqView",
  [
    "components/commons/viewHeader",
    "components/containers/branding",
    "components/infoView"
  ],
  function (ViewHeader, BrandingContainer, InfoView) {
    "use strict";

    return createReactClass ({
      displayName: "FaqView",
      propTypes: {
        title: PropTypes.string,
        body: PropTypes.string,
        loading: PropTypes.bool,
        showCloseButton: PropTypes.bool.isRequired,
        errorMsg: PropTypes.string,
        onBackBtnClick: PropTypes.func.isRequired,
        onMinimizeConversation: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          faqViewHeader: PropTypes.string.isRequired
        }).isRequired,
        viewStyles: PropTypes.shape ({
          fontFamily: PropTypes.string
        })
      },

      render () {
        const {
          text,
          onBackBtnClick,
          viewStyles,
          showCloseButton,
          onMinimizeConversation
        } = this.props;

        return (
          <div className="hs-view" style={viewStyles}>
            <ViewHeader title={text.faqViewHeader}
                        showCloseBtn={showCloseButton}
                        showBackBtn={true}
                        onCloseBtnClick={onMinimizeConversation}
                        onBackBtnClick={onBackBtnClick} />
            {this._renderViewContents ()}
          </div>
        );
      },

      _renderViewContents () {
        const {
          title,
          body,
          loading,
          errorMsg
        } = this.props;

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
            <BrandingContainer />
          </div>
        );
        /* eslint-enable react/no-danger */
      }
    });
  }
);
