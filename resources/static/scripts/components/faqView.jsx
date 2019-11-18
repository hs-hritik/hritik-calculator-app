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
    "components/infoView",
    "gunpowder/widgets/errorBoundary",
    "components/errors/appError",
    "utils/logReactError",
    "components/errors/nonBlockingError"
  ],
  function (ViewHeader, BrandingContainer, InfoView, ErrorBoundary, AppError,
    logReactError, NonBlockingError) {
    "use strict";

    const ViewContents = ({title, body, loading, errorMsg}) => {
      if (loading || errorMsg) {
        return (
          <InfoView loading={loading} title={errorMsg} />
        );
      }

      /* eslint-disable react/no-danger */
      return (
        <div className="hs-view__content">
          <div className="hs-faq" dir="auto">
            <h3 className="hs-faq__title" >{title}</h3>
            <div className="hs-faq__body" dangerouslySetInnerHTML={{__html: body}} />
          </div>
          <BrandingContainer />
        </div>
      );
      /* eslint-enable react/no-danger */
    };

    ViewContents.propTypes = {
      title: PropTypes.string,
      body: PropTypes.string,
      loading: PropTypes.bool,
      errorMsg: PropTypes.string
    };

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

      getInitialState () {
        return {
          blockingErrorIsShown: false
        };
      },

      render () {
        const {
          text,
          onBackBtnClick,
          viewStyles,
          showCloseButton,
          onMinimizeConversation,
          title,
          body,
          loading,
          errorMsg
        } = this.props;

        return (
          <div className="hs-view" style={viewStyles}>
            <ErrorBoundary
              fallbackComponent={this._renderFallbackComponent ()}
              onError={this._handleHeaderError}>
              <ViewHeader
                title={text.faqViewHeader}
                showCloseBtn={showCloseButton}
                showBackBtn={true}
                onCloseBtnClick={onMinimizeConversation}
                onBackBtnClick={onBackBtnClick} />
            </ErrorBoundary>
            <ErrorBoundary
              fallbackComponent={<AppError />}
              onError={this._handleViewContentsError}>
              <ViewContents
                title={title}
                body={body}
                errorMsg={errorMsg}
                loading={loading} />
            </ErrorBoundary>
          </div>
        );
      },

      _renderFallbackComponent () {
        if (this.state.blockingErrorIsShown) {
          return null;
        }

        return (
          <NonBlockingError />
        );
      },

      /**
       * Handle errors in error boundary of view contents
       * @param {Object} error - Error thrown by react
       * @param {Object} info - Additional info about error
       */
      _handleViewContentsError (error, info) {
        this.setState ({
          blockingErrorIsShown: true
        });

        logReactError (error, info);
      }
    });
  }
);
