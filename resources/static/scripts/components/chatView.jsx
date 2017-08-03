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
    "constants/keyCodes",
    "gunpowder/utils/classes",
    "gunpowder/utils/schema",
    "components/containers/replyBox",
    "components/commons/viewHeader",
    "components/starRating"
  ],
  function (MessageList, PROP_TYPES, CHAT_VIEW_CONSTANTS, KEY_CODES,
    classes, schema, ReplyBoxContainer, ViewHeader, StarRating) {
    "use strict";

    const PropTypes = React.PropTypes,
          {ACTIVE_FOOTER} = CHAT_VIEW_CONSTANTS,
          {Input} = schema;

    const INFO_BOT_FIELD_PROPS = PropTypes.shape ({
      title: PropTypes.string.isRequired,
      value: PropTypes.instanceOf (Input).isRequired
    });

    const ChatViewFooter = React.createClass ({
      displayName: "ChatViewFooter",
      propTypes: {
        activeFooter: PropTypes.string.isRequired,
        onFaqSuggestionFeedback: PropTypes.func.isRequired,
        onIssueFeedback: PropTypes.func.isRequired,
        onSubmitCsatRating: PropTypes.func.isRequired,
        onStartNewConversation: PropTypes.func.isRequired,
        onCloseConversation: PropTypes.func.isRequired,
        csatRating: PropTypes.number,
        infoBotField: INFO_BOT_FIELD_PROPS,
        onSubmitInfoBotField: PropTypes.func.isRequired,
        onValueChangeInfoBotField: PropTypes.func.isRequired,
        text: PropTypes.shape ({
          faqSuggestionsAdditionalHelpRequiredBtn: PropTypes.string.isRequired,
          faqSuggestionsAdditionalHelpNotRequiredBtn: PropTypes.string.isRequired,
          problemSolved: PropTypes.string.isRequired,
          problemNotSolved: PropTypes.string.isRequired,
          csatReviewRequest: PropTypes.string.isRequired,
          csatReviewResponse: PropTypes.string.isRequired,
          startNewConversationBtn: PropTypes.string.isRequired,
          closeConversationBtn: PropTypes.string.isRequired
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

          case ACTIVE_FOOTER.INFO_BOT:
            return this._renderInfoBotFooter ();

          case ACTIVE_FOOTER.BLOCKED:
            return this._renderBlockedFooter ();

          case ACTIVE_FOOTER.CLOSED:
            return this._renderClosedConversationFooter ();

          default:
            return null;
        }
      },

      /**
       * Render blocked footer
       */
      _renderBlockedFooter () {
        // @TODO: Add css.
        return (
          <div />
        );
      },

      /**
       * Render closed conversation footer.
       */
      _renderClosedConversationFooter () {
        // @TODO: Update classes.
        const btnClasses = classes (
          "hs-button",
          "hs-button--hollow",
          "hs-button--small"
        );

        return (
          <div>
            <button onClick={this._onCloseConversationClick}
                    className={btnClasses}>
              {this.props.text.closeConversationBtn}
            </button>
          </div>
        );
      },

      /**
       * Render info bot footer.
       */
      _renderInfoBotFooter () {
        const field = this.props.infoBotField;

        return (
          <div>
            <span>{field.title}</span>
            <input value={field.value.value}
                   onChange={this._onInfoBotFieldValueChange}
                   onKeyUp={this._onInfoBotFieldKeyUp} />
            {this._renderInfoBotFieldError ()}
          </div>
        );
      },

      /**
       * Render info bot field error message.
       */
      _renderInfoBotFieldError () {
        const {errorMsg} = this.props.infoBotField.value;
        if (!errorMsg) {
          return null;
        }

        // @TODO: Add error classes.
        return (
          <span>
            {errorMsg}
          </span>
        );
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
        const {faqSuggestionsAdditionalHelpRequiredBtn,
               faqSuggestionsAdditionalHelpNotRequiredBtn} = this.props.text;

        // @TODO: Change classes, both buttons will have same css.
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

        // If user does not need additional help (clicking on no), pass true indicating that
        // faq suggestions were helpful.
        // If user needs additional help (clicking on yes), pass false indicating that
        // faq suggestions were not helpful.
        return (
          <div className="hs-faq-suggestions-feedback">
            <button onClick={this._onFaqSuggestionsFeedbackClick.bind (this, true)}
                    className={helpfulBtnClasses}>
              {faqSuggestionsAdditionalHelpNotRequiredBtn}
            </button>
            <button onClick={this._onFaqSuggestionsFeedbackClick.bind (this, false)}
                    className={notHelpfulBtnClasses}>
              {faqSuggestionsAdditionalHelpRequiredBtn}
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
      },

      /**
       * Click handler for close button.
       */
      _onCloseConversationClick () {
        this.props.onCloseConversation ();
      },

      /**
       * Change handler for info bot field.
       * @param {Object} event
       */
      _onInfoBotFieldValueChange (ev) {
        this.props.onValueChangeInfoBotField (ev.target.value);
      },

      /**
       * Key up handler for info bot field.
       * @param {Object} event
       */
      _onInfoBotFieldKeyUp (ev) {
        if (ev.keyCode === KEY_CODES.ESCAPE) {
          ev.target.blur ();
        } else if (ev.keyCode === KEY_CODES.ENTER) {
          this.props.onSubmitInfoBotField ();
        }
      }
    });

    return React.createClass ({
      displayName: "ChatView",
      propTypes: {
        messages: PropTypes.arrayOf (PropTypes.shape (
          PROP_TYPES.MESSAGE
        )).isRequired,
        onSuggestedFaqClick: PropTypes.func,
        isTyping: PropTypes.bool,
        activeFooter: PropTypes.string.isRequired,
        onFaqSuggestionFeedback: PropTypes.func.isRequired,
        onIssueFeedback: PropTypes.func.isRequired,
        onSubmitCsatRating: PropTypes.func.isRequired,
        onStartNewConversation: PropTypes.func.isRequired,
        onCloseConversation: PropTypes.func.isRequired,
        csatRating: PropTypes.number,
        infoBotField: INFO_BOT_FIELD_PROPS,
        onSubmitInfoBotField: PropTypes.func.isRequired,
        onValueChangeInfoBotField: PropTypes.func.isRequired,
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
                           isTyping={this.props.isTyping}
                           text={this.props.text}
                           onSuggestedFaqClick={this.props.onSuggestedFaqClick} />
            </div>
            <ChatViewFooter activeFooter={this.props.activeFooter}
                            onFaqSuggestionFeedback={this.props.onFaqSuggestionFeedback}
                            onIssueFeedback={this.props.onIssueFeedback}
                            onSubmitCsatRating={this.props.onSubmitCsatRating}
                            onStartNewConversation={this.props.onStartNewConversation}
                            onCloseConversation={this.props.onCloseConversation}
                            csatRating={this.props.csatRating}
                            infoBotField={this.props.infoBotField}
                            onSubmitInfoBotField={this.props.onSubmitInfoBotField}
                            onValueChangeInfoBotField={this.props.onValueChangeInfoBotField}
                            text={this.props.text} />
          </div>
        );
      }
    });
  }
);
