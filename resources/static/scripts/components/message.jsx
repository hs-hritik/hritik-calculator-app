/**
 * Message Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/message",
  [
    "constants/propTypes",
    "constants/message",
    "gunpowder/utils/date"
  ],
  function (PROP_TYPES, MESSAGE_CONSTANTS, dateUtils) {
    "use strict";

    const MESSAGE_TIMESTAP_FORMAT = "{hh}:{MM} {a}";
    const MESSAGE_TYPE = MESSAGE_CONSTANTS.TYPE;

    return React.createClass ({
      displayName: "Message",
      propTypes: PROP_TYPES.MESSAGE,

      render () {
        // @TODO: Add CSS to differentiate user and agent messages.
        return (
          <div>
            {this._renderMessageBody ()}
            {this._renderCreatedTimestamp ()}
          </div>
        );
      },

      /**
       * Render the body of a message. Messages can be of type - text or faq, so
       * they have to be handled differently.
       */
      _renderMessageBody () {
        const {type, body, suggestedFaqs, onSuggestedFaqClick} = this.props;

        if (type === MESSAGE_TYPE.TEXT) {
          /* eslint-disable react/no-danger */
          return (
            <div dangerouslySetInnerHTML={{__html: body}} />
          );
          /* eslint-enable react/no-danger */
        } else if (type === MESSAGE_TYPE.FAQ &&
                   suggestedFaqs.length) {
          return suggestedFaqs.map ((faq) => {
            return (
              <div key={faq.id}
                   onClick={onSuggestedFaqClick.bind (this, faq.id)}>
                {faq.title}
              </div>
            );
          });
        }

        return null;
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
