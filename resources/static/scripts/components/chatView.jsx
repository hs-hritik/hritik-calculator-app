/**
 * ChatView Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/chatView",
  [
    "components/messageList",
    "constants/propTypes",
    "constants/chatView",
    "gunpowder/utils/classes",
    "components/containers/replyBox",
    "components/commons/viewHeader",
    "components/starRating"
  ],
  function (MessageList, PROP_TYPES, CHAT_VIEW_CONSTANTS, classes, ReplyBoxContainer,
    ViewHeader, StarRating) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {ACTIVE_FOOTER} = CHAT_VIEW_CONSTANTS;

    const ChatViewFooter = React.createClass ({
      displayName: "ChatViewFooter",
      propTypes: {
        activeFooter: PropTypes.string.isRequired,
        onFaqSuggestionFeedback: PropTypes.func.isRequired,
        onIssueFeedback: PropTypes.func.isRequired,
        onSubmitCsatRating: PropTypes.func.isRequired,
        onStartNewConversation: PropTypes.func.isRequired,
        csatRating: PropTypes.number,
        text: PropTypes.shape ({
          faqSuggestionsHelpful: PropTypes.string.isRequired,
          faqSuggestionsNotHelpful: PropTypes.string.isRequired,
          problemSolved: PropTypes.string.isRequired,
          problemNotSolved: PropTypes.string.isRequired,
          csatReviewRequest: PropTypes.string.isRequired,
          csatReviewResponse: PropTypes.string.isRequired,
          startNewConversationBtn: PropTypes.string.isRequired
        }).isRequired
      },

      render () {
        return (
          <div className="hs-footer">
            {this._renderFooterComponent ()}
          </div>
        );
      },

      /**
       * Render the active footer component
       */
      _renderFooterComponent () {
        switch (this.props.activeFooter) {
          case ACTIVE_FOOTER.REPLY:
            return <ReplyBoxContainer />;

          case ACTIVE_FOOTER.FAQ_SUGGESTIONS_FEEDBACK:
            return this._renderFaqSuggestionsFeedback ();

          case ACTIVE_FOOTER.ISSUE_FEEDBACK:
            return this._renderIssueFeedback ();

          case ACTIVE_FOOTER.CSAT:
            return this._renderCSATFooter ();

          case ACTIVE_FOOTER.NEW_CONVERSATION:
            return this._renderNewConversationBtn ();

          default:
            return null;
        }
      },

      /**
       * Render CSAT component and "Start new conversation" button.
       */
      _renderCSATFooter () {
        return (
          <div>
            {this._renderCSATRating ()}
            {this._renderNewConversationBtn ()}
          </div>
        );
      },

      /**
       * Render CSAT Rating component if the user hasn't already given any rating.
       */
      _renderCSATRating () {
        const {text, csatRating} = this.props;

        if (csatRating) {
          return (
            <div className="hs-csat">
              <span>{text.csatReviewResponse}</span>
            </div>
          );
        }

        return (
          <div className="hs-csat">
            <span>{text.csatReviewRequest}</span>
            <StarRating name="csat"
                        value={csatRating}
                        onStarClick={this._onStarClick} />
          </div>
        );
      },

      /**
       * Render "Start new conversation" button.
       */
      _renderNewConversationBtn () {
        const btnClasses = classes (
          "hs-button",
          "hs-button--hollow",
          "hs-button--small"
        );

        return (
          <div className="hs-start-conv">
            <button onClick={this._onStartNewConversationClick}
                    className={btnClasses}>
              {this.props.text.startNewConversationBtn}
            </button>
          </div>
        );
      },

      /**
       * Render FAQ suggestions feedback footer.
       */
      _renderFaqSuggestionsFeedback () {
        const {faqSuggestionsHelpful, faqSuggestionsNotHelpful} = this.props.text;
        const helpfulBtnClasses = classes (
          "hs-button",
          "hs-button--secondary",
          "hs-button--hollow",
          "hs-button--x-small",
          "hs-faq-suggestions-feedback__btn"
        );
        const notHelpfulBtnClasses = classes (
          "hs-button",
          "hs-button--hollow",
          "hs-button--x-small",
          "hs-faq-suggestions-feedback__btn"
        );

        return (
          <div className="hs-faq-suggestions-feedback">
            <button onClick={this._onFaqSuggestionsFeedbackClick.bind (this, "yes")}
                    className={helpfulBtnClasses}>
              {faqSuggestionsHelpful}
            </button>
            <button onClick={this._onFaqSuggestionsFeedbackClick.bind (this, "no")}
                    className={notHelpfulBtnClasses}>
              {faqSuggestionsNotHelpful}
            </button>
          </div>
        );
      },

      /**
       * Render Issue feedback footer.
       */
      _renderIssueFeedback () {
        const {problemSolved, problemNotSolved} = this.props.text;
        const btnClasses = classes (
          "hs-button",
          "hs-button--hollow",
          "hs-button--x-small",
          "hs-issue-feedback__btn"
        );

        return (
          <div className="hs-issue-feedback">
            <button onClick={this._onIssueFeedbackClick.bind (this, "yes")}
                    className={btnClasses}>
              {problemSolved}
            </button>
            <button onClick={this._onIssueFeedbackClick.bind (this, "no")}
                    className={btnClasses}>
              {problemNotSolved}
            </button>
          </div>
        );
      },

      /**
       * Click handler for start new conversation button.
       */
      _onStartNewConversationClick () {
        this.props.onStartNewConversation ();
      },

      /**
       * Click handler for faq suggestions feedback
       * @param {String} feedback - "yes" or "no"
       */
      _onFaqSuggestionsFeedbackClick (feedback) {
        this.props.onFaqSuggestionFeedback (feedback);
      },

      /**
       * Click handler for issue feedback
       * @param {String} feedback - "yes" or "no"
       */
      _onIssueFeedbackClick (feedback) {
        this.props.onIssueFeedback (feedback);
      },

      /**
       * Click handler for star
       * @param {Number} value - star index which is clicked
       */
      _onStarClick (value) {
        this.props.onSubmitCsatRating (value);
      }
    });

    return React.createClass ({
      displayName: "ChatView",
      propTypes: {
        messages: PropTypes.arrayOf (PropTypes.shape (
          PROP_TYPES.MESSAGE
        )).isRequired,
        onSuggestedFaqClick: PropTypes.func,
        activeFooter: PropTypes.string.isRequired,
        onFaqSuggestionFeedback: PropTypes.func.isRequired,
        onIssueFeedback: PropTypes.func.isRequired,
        onSubmitCsatRating: PropTypes.func.isRequired,
        onStartNewConversation: PropTypes.func.isRequired,
        csatRating: PropTypes.number,
        text: PropTypes.shape ({
          chatViewHeader: PropTypes.string.isRequired
        }).isRequired
      },

      render () {
        return (
          <div className="hs-view">
            <ViewHeader title={this.props.text.chatViewHeader} />
            <div className="hs-view__content">
              <MessageList messages={this.props.messages}
                           text={this.props.text}
                           onSuggestedFaqClick={this.props.onSuggestedFaqClick} />
            </div>
            <ChatViewFooter activeFooter={this.props.activeFooter}
                            onFaqSuggestionFeedback={this.props.onFaqSuggestionFeedback}
                            onIssueFeedback={this.props.onIssueFeedback}
                            onSubmitCsatRating={this.props.onSubmitCsatRating}
                            onStartNewConversation={this.props.onStartNewConversation}
                            csatRating={this.props.csatRating}
                            text={this.props.text} />
          </div>
        );
      }
    });
  }
);
