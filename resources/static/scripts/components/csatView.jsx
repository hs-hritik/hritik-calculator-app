/**
 * Component for the CSAT view.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 14, 2017
 */

define ("components/csatView",
  [
    "gunpowder/utils/classes",
    "components/commons/viewHeader",
    "components/starRating",
    "components/commons/branding"
  ],
  function (classes, ViewHeader, StarRating, Branding) {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "CsatView",
      propTypes: {
        rating: PropTypes.number.isRequired,
        review: PropTypes.string,
        completed: PropTypes.bool,
        browserIsMobile: PropTypes.bool,
        onMinimizeConversation: PropTypes.func,
        onSubmitCsat: PropTypes.func.isRequired,
        onUpdateCsatRating: PropTypes.func.isRequired,
        onUpdateCsatReview: PropTypes.func.isRequired,
        onCloseConversation: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          csatViewHeader: PropTypes.string.isRequired,
          csatBotFormRequestMsg: PropTypes.string.isRequired,
          csatBotResponseMsg: PropTypes.string.isRequired,
          csatBotFormSubmitBtn: PropTypes.string.isRequired,
          closeConversationBtn: PropTypes.string.isRequired,
          csatBotReviewPlaceholder: PropTypes.string.isRequired,
          csatBotReviewTitle: PropTypes.string.isRequired
        }).isRequired
      },

      render () {
        const {text, browserIsMobile, onMinimizeConversation} = this.props;

        return (
          <div className="hs-view">
            <ViewHeader title={text.csatViewHeader}
                        showCloseBtn={browserIsMobile}
                        onCloseBtnClick={onMinimizeConversation} />
            <div className="hs-view__content">
              <div className="hs-csat">
                {this._renderCsatBody ()}
              </div>
              {this._renderCsatFooter ()}
            </div>
          </div>
        );
      },

      /**
       * Render csat body.
       */
      _renderCsatBody () {
        if (this.props.completed) {
          return this._renderCsatResponseMsg ();
        }
        return this._renderCsatForm ();
      },

      /**
       * Render csat form.
       */
      _renderCsatForm () {
        const {text, rating, review} = this.props;

        return (
          <div className="hs-csat__form">
            <h3 className="hs-csat__form-title">
              {text.csatBotFormRequestMsg}
            </h3>
            <div className="hs-csat__stars">
              <StarRating name="csat"
                          value={rating}
                          onStarClick={this._onStarClick} />
            </div>
            <div>
              <small className="hs-csat__input-title">
                {text.csatBotReviewTitle}
              </small>
              <textarea value={review}
                        dir="auto"
                        className="hs-csat__input"
                        onChange={this._onCsatReviewChange}
                        placeholder={text.csatBotReviewPlaceholder} />
            </div>
          </div>
        );
      },

      /**
       * Render csat response message.
       */
      _renderCsatResponseMsg () {
        const {text} = this.props;
        return (
          <div className="hs-csat__form">
            <h3 className="hs-csat__form-title">
              {text.csatBotResponseMsg}
            </h3>
          </div>
        );
      },

      /**
       * Render csat footer.
       */
      _renderCsatFooter () {
        const {text, rating} = this.props,
              btnProps = {};
        let btnText;
        btnProps.className = classes (
          "hs-button",
          "hs-button--small",
          "hs-csat__footer-btn"
        );

        if (this.props.completed) {
          btnText = text.closeConversationBtn;
          btnProps.onClick = this.props.onCloseConversation;
        } else {
          btnText = text.csatBotFormSubmitBtn;
          btnProps.onClick = this.props.onSubmitCsat;
          btnProps.disabled = (rating === 0);
        }

        return (
          <div className="hs-csat__footer">
            <button {...btnProps}>
              {btnText}
            </button>
            <Branding text={text} />
          </div>
        );
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