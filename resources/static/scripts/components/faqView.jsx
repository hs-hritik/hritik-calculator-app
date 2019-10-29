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
    "extras/accessibility",
    "constants/accessibility",
    "constants/activeView",
    "helpers/common"
  ],
  function (ViewHeader, BrandingContainer, InfoView, ax, axConstants, activeViewConstants,
    commonHelpers) {
    "use strict";

    const {PropTypes} = React;
    const {
      METALIST_ITEMS,
      METALIST_GROUP_NAME
    } = axConstants;

    return React.createClass ({
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
          faqViewHeader: PropTypes.string.isRequired,
          ariaLabels: PropTypes.shape ({
            loading: PropTypes.string,
            faqViewHeader: PropTypes.string
          })
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

        const viewHeaderDataLabels = {
          backBtnDataLabel: METALIST_ITEMS.FAQ.BACK_BTN.DATA_LABEL
        };

        return (
          <div className="hs-view" style={viewStyles}>
            <ViewHeader title={text.faqViewHeader}
                        showCloseBtn={showCloseButton}
                        showBackBtn={true}
                        onCloseBtnClick={onMinimizeConversation}
                        onBackBtnClick={onBackBtnClick}
                        dataLabels={viewHeaderDataLabels}
                        ariaLabel={text.ariaLabels.faqViewHeader}/>
            {this._renderViewContents ()}
          </div>
        );
      },

      _renderViewContents () {
        const {
          title,
          body,
          loading,
          errorMsg,
          text
        } = this.props;

        if (loading || errorMsg) {
          return (
            <InfoView loading={loading}
                      title={errorMsg}
                      ariaLabel={text.ariaLabels.loading} />
          );
        }

        const _setWrapperAxActiveIndex = this._setAxActiveIndex.bind (
          this, {
            selector: METALIST_ITEMS.FAQ.CONTENT_WRAPPER.SELECTOR
          }
        );

        /* eslint-disable react/no-danger */
        return (
          <div
            className="hs-view__content"
            tabIndex="0"
            data-label={METALIST_ITEMS.FAQ.CONTENT_WRAPPER.DATA_LABEL}
            onClick={_setWrapperAxActiveIndex}>
            <div className="hs-faq" dir="auto">
              <h3 className="hs-faq__title" >{title}</h3>
              <div className="hs-faq__body"
                    dangerouslySetInnerHTML={{__html: body}}
                    onClick={this._onFaqBodyClick} />
            </div>
            <BrandingContainer />
          </div>
        );
        /* eslint-enable react/no-danger */
      },

      _onFaqBodyClick (event) {
        const selector = commonHelpers.getSelectorForElement (event.target);

        ax.setActiveIndex ({
          selector: selector
        });
      },

      /**
       * This function is called on focus or click event on element
       * It calls ax function to update active index
       *
       * @param {Object} config.selector - Selector value
       * @param {Object} ev - Click or focus event object
       */
      _setAxActiveIndex (config, ev) {
        ev.stopPropagation ();
        ax.setActiveIndex (config);
      },

      componentDidUpdate () {
        const {body} = this.props;

        ax.clearDelayFocus ();

        if (body) {
          const elements = document.querySelectorAll (".hs-faq__body a");
          const selectors = [];

          for (let i = 0; i < elements.length; i++) {
            selectors.push (commonHelpers.getSelectorForElement (elements[i]));
          }

          ax.replaceSelectors ({
            name: METALIST_GROUP_NAME.FAQ.FAQ_BODY_LINKS,
            selectors
          });
        }
      },

      componentDidMount () {
        ax.setActiveView (activeViewConstants.FAQ);
        ax.delayFocus ();
      }
    });
  }
);
