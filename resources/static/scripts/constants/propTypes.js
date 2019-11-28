/**
 * Common component prop types.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define (
  "constants/propTypes",
  [
    "gunpowder/constants/widgets/dragIt"
  ],
  function (dragItConstants) {
    "use strict";

    const PropTypes = React.PropTypes;
    const {NAVIGATION_STATES: LIST_PICKER_NAVIGATION_STATES} = dragItConstants;

    const MESSAGE_PROP_TYPE = PropTypes.shape ({
      id: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      body: PropTypes.string,
      redacted: PropTypes.bool,
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
    }).isRequired;

    const OPTION_PROP_TYPE = PropTypes.shape ({
      label: PropTypes.string,
      value: PropTypes.string
    });

    const USER_INPUT_PROP_TYPE = PropTypes.shape ({
      type: PropTypes.string.isRequired,
      value: PropTypes.string,
      options: PropTypes.arrayOf (OPTION_PROP_TYPE),
      disabled: PropTypes.bool,
      label: PropTypes.string,
      required: PropTypes.bool,
      skipLabel: PropTypes.string,
      placeholder: PropTypes.string,
      errorMsg: PropTypes.string,
      listPicker: PropTypes.shape ({
        navigationState: PropTypes.oneOf ([
          LIST_PICKER_NAVIGATION_STATES.CLOSED,
          LIST_PICKER_NAVIGATION_STATES.OPENED,
          LIST_PICKER_NAVIGATION_STATES.RESIZING
        ])
      })
    });

    return {
      MESSAGE_PROP_TYPE,
      USER_INPUT_PROP_TYPE
    };
  });
