/**
 * Message Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/message",
  [
    "constants/propTypes",
    "constants/message",
    "gunpowder/utils/date",
    "gunpowder/utils/classes",
    "gunpowder/utils/object"
  ],
  function (PROP_TYPES, MESSAGE_CONSTANTS, dateUtils, classes, objUtils) {
    "use strict";

    const MESSAGE_TIMESTAP_FORMAT = "{hh}:{MM} {a}";
    const MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE;
    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "Message",
      propTypes: {
        message: PropTypes.shape (PROP_TYPES.MESSAGE).isRequired,
        showAgentNickname: PropTypes.bool,
        isLastMessage: PropTypes.bool,
        onSuggestedFaqClick: PropTypes.func,
        onStartCsatSurveyClick: PropTypes.func,
        text: PropTypes.shape ({
          faqSuggestionsMsgTitle: PropTypes.string.isRequired,
          csatBotRequestMsg: PropTypes.string.isRequired,
          csatLinkCaption: PropTypes.string.isRequired
        }).isRequired
      },

      getDefaultProps () {
        return {
          showAgentNickname: false,
          isLastMessage: false
        };
      },

      render () {
        const {isCustomerMsg} = this.props.message;
        const msgClasses = classes (
          "hs-message", {
            "hs-message--right": isCustomerMsg
          }
        );

        return (
          <div className={msgClasses}>
            {this._renderMessage ()}
            {this._renderAgentNameAndTimestamp ()}
          </div>
        );
      },

      /**
       * Render the message according to its type.
       */
      _renderMessage () {
        const {type} = this.props.message;

        switch (type) {
          case MESSAGE_TYPE.TEXT:
            return this._renderTextMessage ();

          case MESSAGE_TYPE.FAQ:
            return this._renderFaqMessage ();

          case MESSAGE_TYPE.CSAT:
            return this._renderCsatMessage ();

          case MESSAGE_TYPE.END_CHAT:
            return this._renderEndChatMessage ();

          default:
            return null;
        }
      },

      /**
       * Render text message.
       */
      _renderTextMessage () {
        /* eslint-disable react/no-danger */
        return (
          <div>
            <div dangerouslySetInnerHTML={{__html: this.props.message.body}} />
          </div>
        );
        /* eslint-enable react/no-danger */
      },

      /**
       * Render FAQ suggestions message.
       */
      _renderFaqMessage () {
        if (!this.props.message.suggestedFaqs.length) {
          return null;
        }

        const {text} = this.props;

        return (
          <div>
            <div className="hs-message--suggested-faqs__title">
              {text.faqSuggestionsMsgTitle}
            </div>
            <div className="hs-message--suggested-faqs">
              {this._renderFaqs ()}
            </div>
          </div>
        );
      },

      /**
       * Render an faq, which is a part of the faq message.
       */
      _renderFaqs () {
        const {suggestedFaqs} = this.props.message;

        return suggestedFaqs.map ((faq) => {
          return (
            <div key={faq.id}
                 className="hs-suggested-faq"
                 onClick={this.props.onSuggestedFaqClick.bind (this, faq.id)}>
              {faq.title}
            </div>
          );
        });
      },

      /**
       * Render csat request message.
       */
      _renderCsatMessage () {
        const {text} = this.props;

        // @TODO: Rename classes. Also correct BEM notation.
        return (
          <div>
            <div className="hs-message--suggested-faqs__title">
              {text.csatBotRequestMsg}
            </div>
            <div className="hs-message--suggested-faqs">
              <div className="hs-suggested-faq"
                   onClick={this.props.onStartCsatSurveyClick}>
                {text.csatLinkCaption}
              </div>
            </div>
          </div>
        );
      },

      /**
       * Render end chat message.
       */
      _renderEndChatMessage () {
        // @TODO: Add css and show agent nickname if enabled
        return (
          <div>
            Agent ended chat
          </div>
        );
      },

      /**
       * Render agent name and message timestamp.
       */
      _renderAgentNameAndTimestamp () {
        if (!this.props.isLastMessage) {
          return null;
        }

        const {message, showAgentNickname} = this.props;
        let agentNickname = null;

        if (!(message.isCustomerMsg || message.isSystemMsg)) {
          // If agent nickname is disabled, or the agent hasn't set the nickname, show "Agent"
          agentNickname = "Agent";

          if (showAgentNickname) {
            // There won't be any author for system generated messages.
            agentNickname = objUtils.getIn (message, ["author", "nickname"]) || agentNickname;
          }
        }

        const timeAgoMs = Date.now () - message.createdTs;
        let timeAgoStr;

        // If the message came in the last one minute, show "Just now".
        if (timeAgoMs < 60000) {
          timeAgoStr = "Just now";
        } else {
          timeAgoStr = dateUtils.humanizeDuration (timeAgoMs, {
            shortForm: true,
            maxUnits: 1
          });
        }

        return (
          <div>
            <span>{agentNickname}</span>
            <span>{timeAgoStr}</span>
          </div>
        );
      },

      /**
       * Render message's created at timestamp.
       */
      _renderCreatedTimestamp () {
        const timeStr = dateUtils.format (this.props.message.createdTs, MESSAGE_TIMESTAP_FORMAT);

        return (
          <small className="hs-message__timestamp">{timeStr}</small>
        );
      }
    });
  }
);
