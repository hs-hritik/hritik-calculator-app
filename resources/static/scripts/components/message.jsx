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
        text: PropTypes.shape ({
          faqSuggestionsMsgTitle: PropTypes.string.isRequired
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
        const {type, suggestedFaqs = []} = this.props.message;

        if (type === MESSAGE_TYPE.TEXT) {
          return this._renderTextMessage ();
        } else if (type === MESSAGE_TYPE.FAQ && suggestedFaqs.length) {
          return this._renderFaqMessage ();
        }

        return null;
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
       * Render agent name and message timestamp.
       */
      _renderAgentNameAndTimestamp () {
        if (!this.props.isLastMessage) {
          return null;
        }

        const {message, showAgentNickname} = this.props;
        let agentName = null;

        if (showAgentNickname && !message.isCustomerMsg) {
          // There won't be any author for system generated messages.
          // @TODO: Backend change to pass agent nickname pending.
          // @TODO: Confirm from PM/design if we have to show agent's actual
          // name if showAgentNickname is disabled.
          agentName = objUtils.getIn (message, ["author", "name"]);
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
            <span>{agentName}</span>
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
