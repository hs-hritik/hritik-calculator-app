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
    "components/containers/replyBox",
    "components/commons/viewHeader",
    "components/starRating"
  ],
  function (MessageList, PROP_TYPES, CHAT_VIEW_CONSTANTS, ReplyBoxContainer,
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
          csatReviewResponse: PropTypes.string.isRequired,
          startNewConversationBtn: PropTypes.string.isRequired
        }).isRequired
      },

      render () {
        return (
          <div>
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
            {this._renderStartConversationBtn ()}
          </div>
        );
      },

      /**
       * Render CSAT Rating component if the user hasn't already given any rating.
       */
      _renderCSATRating () {
        if (this.props.csatRating) {
          return (
            <span>{this.props.text.csatReviewResponse}</span>
          );
        }

        return (
          <StarRating name="csat"
                      value={this.props.csatRating}
                      onStarClick={this._onStarClick} />
        );
      },

      /**
       * Render "Start new conversation" button.
       */
      _renderStartConversationBtn () {
        return (
          <button onClick={this._onStartNewConversationClick}>
            {this.props.text.startNewConversationBtn}
          </button>
        );
      },

      /**
       * Render FAQ suggestions feedback footer.
       */
      _renderFaqSuggestionsFeedback () {
        const {faqSuggestionsHelpful, faqSuggestionsNotHelpful} = this.props.text;

        return (
          <div>
            <button onClick={this._onFaqSuggestionsFeedbackClick.bind (this, "yes")}>
              {faqSuggestionsHelpful}
            </button>
            <button onClick={this._onFaqSuggestionsFeedbackClick.bind (this, "no")}>
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

        return (
          <div>
            <button onClick={this._onIssueFeedbackClick.bind (this, "yes")}>
              {problemSolved}
            </button>
            <button onClick={this._onIssueFeedbackClick.bind (this, "no")}>
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
          <div>
            <ViewHeader title={this.props.text.chatViewHeader} />
            <MessageList messages={this.props.messages}
                         onSuggestedFaqClick={this.props.onSuggestedFaqClick} />
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
