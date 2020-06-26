/**
 * Component for the CSAT view.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 14, 2017
 */

define("components/csatView", [
  "components/commons/viewHeader",
  "components/csatViewBody",
  "components/csatViewFooter",
  "components/containers/branding",
  "components/errorBoundaryWithLogging",
  "components/errors/appError",
  "components/errors/nonBlockingError",
  "extras/accessibility",
  "constants/activeView",
  "gunpowder/utils/classes"
], function(
  ViewHeader,
  CsatViewBody,
  CsatViewFooter,
  BrandingContainer,
  ErrorBoundaryWithLogging,
  AppError,
  NonBlockingError,
  ax,
  activeViewConstants,
  classes
) {
  "use strict";

  const TEXT_PROP_TYPE = PropTypes.shape({
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
    onSubmitCsat,
    setAxActiveIndex,
    onUpdateStarRating
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
          onCsatReviewChange={onCsatReviewChange}
          setAxActiveIndex={setAxActiveIndex}
          onUpdateStarRating={onUpdateStarRating}
        />
        <BrandingContainer />
        <CsatViewFooter
          rating={rating}
          csatSaveInProgress={csatSaveInProgress}
          allowFullScreen={allowFullScreen}
          submitBtnText={text.csatBotFormSubmitBtn}
          onSubmitCsat={onSubmitCsat}
          setAxActiveIndex={setAxActiveIndex}
        />
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
    onSubmitCsat: PropTypes.func.isRequired,
    setAxActiveIndex: PropTypes.func.isRequired,
    onUpdateStarRating: PropTypes.func
  };

  return createReactClass({
    displayName: "CsatView",
    propTypes: {
      rating: PropTypes.number.isRequired,
      review: PropTypes.string,
      showCloseButton: PropTypes.bool.isRequired,
      allowFullScreen: PropTypes.bool,
      onMinimizeConversation: PropTypes.func.isRequired,
      onKeyDown: PropTypes.func,
      onClick: PropTypes.func,
      onSubmitCsat: PropTypes.func.isRequired,
      onUpdateCsatRating: PropTypes.func.isRequired,
      onUpdateCsatReview: PropTypes.func.isRequired,
      text: TEXT_PROP_TYPE,
      viewStyles: PropTypes.shape({
        fontFamily: PropTypes.string
      }),
      csatSaveInProgress: PropTypes.bool,
      onUpdateStarRating: PropTypes.func,
      keyboardInteractionIsActive: PropTypes.bool.isRequired,
      showHeaderAvatar: PropTypes.bool.isRequired,
      appAvatarUrl: PropTypes.string
    },

    getInitialState() {
      return {
        blockingErrorIsVisible: false
      };
    },

    render() {
      const {
        text,
        showCloseButton,
        viewStyles,
        rating,
        review,
        csatSaveInProgress,
        onSubmitCsat,
        keyboardInteractionIsActive,
        onUpdateStarRating,
        onMinimizeConversation,
        onKeyDown,
        onClick,
        showHeaderAvatar,
        appAvatarUrl
      } = this.props;

      const viewClasses = classes("hs-view", {
        "outline-hidden": !keyboardInteractionIsActive
      });

      return (
        <div className={viewClasses} style={viewStyles} onKeyDown={onKeyDown} onClick={onClick}>
          <ErrorBoundaryWithLogging fallbackComponent={this._renderHeaderFallback()}>
            <ViewHeader
              title={text.chatViewHeader}
              showCloseBtn={showCloseButton}
              onCloseBtnClick={onMinimizeConversation}
              avatarUrl={appAvatarUrl}
              showAvatar={showHeaderAvatar}
            />
          </ErrorBoundaryWithLogging>
          <ErrorBoundaryWithLogging
            fallbackComponent={<AppError />}
            onError={this._handleViewContentsError}>
            <CsatViewContents
              text={text}
              rating={rating}
              review={review}
              csatSaveInProgress={csatSaveInProgress}
              onStarClick={this._onStarClick}
              onCsatReviewChange={this._onCsatReviewChange}
              onSubmitCsat={onSubmitCsat}
              setAxActiveIndex={this._setAxActiveIndex}
              onUpdateStarRating={onUpdateStarRating}
            />
          </ErrorBoundaryWithLogging>
        </div>
      );
    },

    _renderHeaderFallback() {
      if (this.state.blockingErrorIsVisible) {
        return null;
      }

      return <NonBlockingError />;
    },

    /**
     * Handle errors in error boundary
     * @param {Object} error - Error thrown by react
     * @param {Object} info - Additional info about error
     */
    _handleViewContentsError() {
      this.setState({
        blockingErrorIsVisible: true
      });
    },

    /**
     * Csat review change handler.
     */
    _onCsatReviewChange(ev) {
      this.props.onUpdateCsatReview(ev.target.value);
    },

    /**
     * Click handler for star
     * @param {Number} value - star index which is clicked
     */
    _onStarClick(value) {
      this.props.onUpdateCsatRating(value);
    },

    /**
     * This function is called on focus or click event on element
     * It calls ax function to update active index
     *
     * @param {Object} config.selector - Selector value
     */
    _setAxActiveIndex(config) {
      ax.setActiveIndex(config);
    },

    componentDidMount() {
      ax.setActiveView(activeViewConstants.CSAT);
      ax.focus();
    }
  });
});
