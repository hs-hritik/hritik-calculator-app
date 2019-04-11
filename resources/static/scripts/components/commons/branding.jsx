/**
 * Helpshift Branding Component.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 21, 2017
 */

define ("components/commons/branding",
  function () {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "Branding",
      propTypes: {
        hide: PropTypes.bool,
        text: PropTypes.shape ({
          branding: PropTypes.string.isRequired
        }).isRequired
      },

      render () {
        // Because we want a little gap between the last message and
        // chat window, we use this element to create a small padding.
        if (this.props.hide) {
          return <div className="hs-branding--hidden" />;
        }

        return (
          <small className="hs-branding">
            {this.props.text.branding}
          </small>
        );
      }
    });
  }
);
