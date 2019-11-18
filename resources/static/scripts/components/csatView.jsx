/**
 * Component for the CSAT view.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 14, 2017
 */

define ("components/csatView",
  [
    "components/commons/viewHeader",
    "components/csatViewBody",
    "components/csatViewFooter",
    "components/containers/branding",
    "gunpowder/widgets/errorBoundary",
    "components/errors/appError",
    "utils/logReactError",
    "components/errors/nonBlockingError"
  ],
  function (ViewHeader, CsatViewBody, CsatViewFooter, BrandingContainer, ErrorBoundary,
    AppError, logReactError, NonBlockingError) {
    "use strict";

    const TEXT_PROP_TYPE = PropTypes.shape ({
      csatViewHeader: PropTypes.string.isRequired,
      csatBotRequestMsg: PropTypes.string.isRequired,
      csatBotResponseMsg: PropTypes.string.isRequired,
      csatBotFormSubmitBtn: PropTypes.string.isRequired,
      csatBotReviewPlaceholder: PropTypes.string.isRequired,
      csatBotReviewTitle: PropTypes.string.isRequired
    }).isRequired;

    const CsatViewContents = ({
      text,
      rating,
      review,
      csatSaveInProgress,
      allowFullScreen,
      onStarClick,
      onCsatReviewChange,
      onSubmitCsat
    }) => (
      <div className="hs-view__content">
        <div className="hs-csat">
          <CsatViewBody
            csatBotRequestMsg={text.csatBotRequestMsg}
            csatBotReviewTitle={text.csatBotRequestMsg}
            csatBotReviewPlaceholder={text.csatBotReviewPlaceholder}
            rating={rating}
            review={review}
            csatSaveInProgress={csatSaveInProgress}
            onStarClick={onStarClick}
            onCsatReviewChange={onCsatReviewChange} />
          <BrandingContainer />
          <CsatViewFooter
            rating={rating}
            csatSaveInProgress={csatSaveInProgress}
            allowFullScreen={allowFullScreen}
            submitBtnText={text.csatBotFormSubmitBtn}
            onSubmitCsat={onSubmitCsat} />
        </div>
      </div>
    );

    CsatViewContents.propTypes = {
      text: TEXT_PROP_TYPE,
      rating: PropTypes.number.isRequired,
      review: PropTypes.string,
      csatSaveInProgress: PropTypes.bool,
      allowFullScreen: PropTypes.bool,
      onStarClick: PropTypes.func.isRequired,
      onCsatReviewChange: PropTypes.func.isRequired,
      onSubmitCsat: PropTypes.func.isRequired
    };

    return createReactClass ({
      displayName: "CsatView",
      propTypes: {
        rating: PropTypes.number.isRequired,
        review: PropTypes.string,
        showCloseButton: PropTypes.bool.isRequired,
        allowFullScreen: PropTypes.bool,
        onMinimizeConversation: PropTypes.func.isRequired,
        onSubmitCsat: PropTypes.func.isRequired,
        onUpdateCsatRating: PropTypes.func.isRequired,
        onUpdateCsatReview: PropTypes.func.isRequired,
        text: TEXT_PROP_TYPE,
        viewStyles: PropTypes.shape ({
          fontFamily: PropTypes.string
        }),
        csatSaveInProgress: PropTypes.bool
      },

      getInitialState () {
        return {
          blockingErrorIsVisible: false
        };
      },

      render () {
        const {
          text,
          showCloseButton,
          onMinimizeConversation,
          viewStyles,
          rating,
          review,
          csatSaveInProgress,
          onSubmitCsat
        } = this.props;

        return (
          <div className="hs-view" style={viewStyles}>
            <ErrorBoundary
              fallbackComponent={this._renderHeaderFallback ()}
              onError={this._handleHeaderError}>
              <ViewHeader
                title={text.csatViewHeader}
                showCloseBtn={showCloseButton}
                onCloseBtnClick={onMinimizeConversation} />
            </ErrorBoundary>
            <ErrorBoundary
              fallbackComponent={<AppError />}
              onError={this._handleViewContentsError}>
              <CsatViewContents
                text={text}
                rating={rating}
                review={review}
                csatSaveInProgress={csatSaveInProgress}
                onStarClick={this._onStarClick}
                onCsatReviewChange={this._onCsatReviewChange}
                onSubmitCsat={onSubmitCsat} />
            </ErrorBoundary>
          </div>
        );
      },

      _renderHeaderFallback () {
        if (this.state.blockingErrorIsVisible) {
          return null;
        }

        return (
          <NonBlockingError />
        );
      },

      _handleHeaderError (error, info) {
        logReactError (error, info);
      },

      /**
       * Handle errors in error boundary
       * @param {Object} error - Error thrown by react
       * @param {Object} info - Additional info about error
       */
      _handleViewContentsError (error, info) {
        this.setState ({
          blockingErrorIsVisible: true
        });

        logReactError (error, info);
      },

      /**
       * Csat review change handler.
       */
      _onCsatReviewChange (ev) {
        this.props.onUpdateCsatReview (ev.target.value);
      },

      /**
       * Click handler for star
       * @param {Number} value - star index which is clicked
       */
      _onStarClick (value) {
        this.props.onUpdateCsatRating (value);
      }
    });
  }
);