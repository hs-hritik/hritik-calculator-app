/**
 * Message Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/message",
  [
    "constants/propTypes",
    "gunpowder/utils/date"
  ],
  function (PROP_TYPES, dateUtils) {
    "use strict";

    const MESSAGE_TIMESTAP_FORMAT = "{hh}:{MM} {a}";

    return React.createClass ({
      displayName: "Message",
      propTypes: PROP_TYPES.MESSAGE,

      render () {
        // @TODO: Add CSS to differentiate user and agent messages.
        return (
          <div>
            {this.props.body}
            {this._renderCreatedTimestamp ()}
          </div>
        );
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
