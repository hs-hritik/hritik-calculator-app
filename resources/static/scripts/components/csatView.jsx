/**
 * Component for the CSAT view.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 14, 2017
 */

define ("components/csatView",
  [
    "gunpowder/utils/classes",
    "components/commons/viewHeader",
    "components/starRating"
  ],
  function (classes, ViewHeader, StarRating) {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "CsatView",
      propTypes: {
        rating: PropTypes.number.isRequired,
        review: PropTypes.string,
        completed: PropTypes.bool,
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
        const {text} = this.props;
        // @TODO: Add/change css classes.
        return (
          <div className="hs-view">
            <ViewHeader title={text.csatViewHeader} />
            <div className="hs-view__content">
              {this._renderCsatBody ()}
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
          <div>
            <div>{text.csatBotFormRequestMsg}</div>
              <StarRating name="csat"
                          value={rating}
                          onStarClick={this._onStarClick} />
              <div>
                <span>{text.csatBotReviewTitle}</span>
                <textarea value={review}
                          onChange={this._onCsatReviewChange}
                          placeholder={text.csatBotReviewPlaceholder}
                          autoFocus />
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
          <div>
            {text.csatBotResponseMsg}
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

        if (this.props.completed) {
          btnText = text.closeConversationBtn;
          btnProps.onClick = this.props.onCloseConversation;
        } else {
          btnText = text.csatBotFormSubmitBtn;
          btnProps.onClick = this.props.onSubmitCsat;
          btnProps.disabled = (rating === 0);
        }

        return (
          <div>
            <button {...btnProps}>
              {btnText}
            </button>
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