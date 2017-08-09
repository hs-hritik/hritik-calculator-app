/**
 * Common component prop types.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define ("constants/propTypes",
  function () {
    "use strict";

    const PropTypes = React.PropTypes;

    const MESSAGE = {
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      body: PropTypes.string,
      isCustomerMsg: PropTypes.bool.isRequired,
      createdTs: PropTypes.number.isRequired,
      author: PropTypes.shape ({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      }),
      suggestedFaqs: PropTypes.arrayOf (
        PropTypes.shape ({
          id: PropTypes.string.isRequired,
          title: PropTypes.string.isRequired
        })
      )
    };

    return {
      MESSAGE
    };
  });
