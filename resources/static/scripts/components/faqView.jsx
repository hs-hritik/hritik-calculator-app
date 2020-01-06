/**
 * Component for the FAQ view.
 * Renders an FAQ's header, body, and footer.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created June 14, 2017
 */

define("components/faqView", [
  "components/commons/viewHeader",
  "components/containers/branding",
  "components/infoView",
  "components/errorBoundaryWithLogging",
  "components/errors/appError",
  "components/errors/nonBlockingError",
  "extras/accessibility",
  "constants/accessibility",
  "constants/activeView",
  "helpers/common",
  "gunpowder/utils/classes"
], function(
  ViewHeader,
  BrandingContainer,
  InfoView,
  ErrorBoundaryWithLogging,
  AppError,
  NonBlockingError,
  ax,
  axConstants,
  activeViewConstants,
  commonHelpers,
  classes
) {
  "use strict";

  const {METALIST_ITEMS, METALIST_GROUP_NAME} = axConstants;

  const ViewContents = ({
    title,
    body,
    loading,
    errorMsg,
    ariaLabelLoading,
    onFaqContentWrapperClick,
    onFaqBodyClick
  }) => {
    if (loading || errorMsg) {
      return <InfoView loading={loading} title={errorMsg} ariaLabel={ariaLabelLoading} />;
    }

    /* eslint-disable react/no-danger */
    return (
      <div
        className="hs-view__content"
        tabIndex="0"
        data-label={METALIST_ITEMS.FAQ.CONTENT_WRAPPER.DATA_LABEL}
        onClick={onFaqContentWrapperClick}>
        <div className="hs-faq" dir="auto">
          <h3 className="hs-faq__title">{title}</h3>
          <div
            className="hs-faq__body"
            dangerouslySetInnerHTML={{__html: body}}
            onClick={onFaqBodyClick}
          />
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
    errorMsg: PropTypes.string,
    ariaLabelLoading: PropTypes.string,
    onFaqContentWrapperClick: PropTypes.func.isRequired,
    onFaqBodyClick: PropTypes.func.isRequired
  };

  return createReactClass({
    displayName: "FaqView",
    propTypes: {
      title: PropTypes.string,
      body: PropTypes.string,
      loading: PropTypes.bool,
      showCloseButton: PropTypes.bool.isRequired,
      errorMsg: PropTypes.string,
      onBackBtnClick: PropTypes.func.isRequired,
      onMinimizeConversation: PropTypes.func.isRequired,
      onKeyDown: PropTypes.func.isRequired,
      onClick: PropTypes.func.isRequired,
      text: PropTypes.shape({
        faqViewHeader: PropTypes.string.isRequired,
        ariaLabelLoading: PropTypes.string,
        ariaLabelFaqViewHeader: PropTypes.string
      }).isRequired,
      viewStyles: PropTypes.shape({
        fontFamily: PropTypes.string
      }),
      keyboardInteractionIsActive: PropTypes.bool.isRequired
    },

    getInitialState() {
      return {
        blockingErrorIsShown: false
      };
    },

    render() {
      const {
        text,
        onBackBtnClick,
        viewStyles,
        showCloseButton,
        title,
        body,
        loading,
        errorMsg,
        keyboardInteractionIsActive,
        onMinimizeConversation,
        onKeyDown,
        onClick
      } = this.props;

      const viewHeaderDataLabels = {
        backBtnDataLabel: METALIST_ITEMS.FAQ.BACK_BTN.DATA_LABEL
      };

      const viewClasses = classes("hs-view", {
        "outline-hidden": !keyboardInteractionIsActive
      });

      return (
        <div className={viewClasses} style={viewStyles} onKeyDown={onKeyDown} onClick={onClick}>
          <ErrorBoundaryWithLogging fallbackComponent={this._renderFallbackComponent()}>
            <ViewHeader
              title={text.faqViewHeader}
              showCloseBtn={showCloseButton}
              showBackBtn
              onCloseBtnClick={onMinimizeConversation}
              onBackBtnClick={onBackBtnClick}
              dataLabels={viewHeaderDataLabels}
              ariaLabel={text.ariaLabelFaqViewHeader}
            />
          </ErrorBoundaryWithLogging>
          <ErrorBoundaryWithLogging
            fallbackComponent={<AppError />}
            onError={this._handleViewContentsError}>
            <ViewContents
              title={title}
              body={body}
              errorMsg={errorMsg}
              loading={loading}
              text={text}
              onFaqBodyClick={this._onFaqBodyClick}
              onFaqContentWrapperClick={this._onFaqContentWrapperClick}
            />
          </ErrorBoundaryWithLogging>
        </div>
      );
    },

    _renderFallbackComponent() {
      if (this.state.blockingErrorIsShown) {
        return null;
      }

      return <NonBlockingError />;
    },

    /**
     * Handle errors in error boundary of view contents
     * @param {Object} error - Error thrown by react
     * @param {Object} info - Additional info about error
     */
    _handleViewContentsError() {
      this.setState({
        blockingErrorIsShown: true
      });
    },

    _onFaqBodyClick(event) {
      const selector = commonHelpers.getSelectorForElement(event.target);

      ax.setActiveIndex({
        selector: selector
      });
    },

    _onFaqContentWrapperClick() {
      this._setAxActiveIndex({
        selector: METALIST_ITEMS.FAQ.CONTENT_WRAPPER.SELECTOR
      });
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

    componentDidUpdate() {
      const {body} = this.props;

      ax.clearDelayFocus();

      if (body) {
        const elements = document.querySelectorAll(".hs-faq__body a");
        const selectors = [];

        for (let i = 0; i < elements.length; i++) {
          selectors.push(commonHelpers.getSelectorForElement(elements[i]));
        }

        ax.replaceSelectors({
          group: METALIST_GROUP_NAME.FAQ.FAQ_BODY_LINKS,
          selectors
        });
      }
    },

    componentDidMount() {
      ax.setActiveView(activeViewConstants.FAQ);
      ax.delayFocus();
    }
  });
});
