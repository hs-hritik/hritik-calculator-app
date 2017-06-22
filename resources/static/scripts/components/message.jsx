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
    "gunpowder/utils/classes"
  ],
  function (PROP_TYPES, MESSAGE_CONSTANTS, dateUtils, classes) {
    "use strict";

    const MESSAGE_TIMESTAP_FORMAT = "{hh}:{MM} {a}";
    const MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE;
    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "Message",
      propTypes: {
        message: PropTypes.shape (PROP_TYPES.MESSAGE).isRequired,
        onSuggestedFaqClick: PropTypes.func,
        text: PropTypes.shape ({
          faqSuggestionsMsgTitle: PropTypes.string.isRequired
        }).isRequired
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
            {this._renderCreatedTimestamp ()}
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
       * Render message's created at timestamp.
       */
      _renderCreatedTimestamp () {
        const timeStr = dateUtils.format (this.props.message.createdTs, MESSAGE_TIMESTAP_FORMAT);

        return (
          <small>{timeStr}</small>
        );
      }
    });
  }
);
