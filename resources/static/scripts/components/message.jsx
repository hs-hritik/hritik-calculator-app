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

    return React.createClass ({
      displayName: "Message",
      propTypes: PROP_TYPES.MESSAGE,

      render () {
        const {isCustomerMsg} = this.props;
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
        const {type, suggestedFaqs = []} = this.props;

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
            <div dangerouslySetInnerHTML={{__html: this.props.body}} />
            {this._renderCreatedTimestamp ()}
          </div>
        );
        /* eslint-enable react/no-danger */
      },

      /**
       * Render FAQ suggestions message.
       */
      _renderFaqMessage () {
        const {suggestedFaqs, onSuggestedFaqClick} = this.props;

        return suggestedFaqs.map ((faq) => {
          return (
            <div key={faq.id}
                 onClick={onSuggestedFaqClick.bind (this, faq.id)}>
              {faq.title}
            </div>
          );
        });
      },

      /**
       * Render message's created at timestamp.
       */
      _renderCreatedTimestamp () {
        const timeStr = dateUtils.format (this.props.createdTs, MESSAGE_TIMESTAP_FORMAT);

        return (
          <span>{timeStr}</span>
        );
      }
    });
  }
);
