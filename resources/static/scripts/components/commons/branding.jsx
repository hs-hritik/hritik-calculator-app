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
        text: PropTypes.shape ({
          branding: PropTypes.string.isRequired
        }).isRequired
      },

      render () {
        return (
          <small className="hs-branding">
            {this.props.text.branding}
          </small>
        );
      }
    });
  }
);
