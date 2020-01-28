/**
 * Common component prop types.
 * @author Manish Garg <manish@helpshift.com>
 * @created May 31, 2017
 */

define("constants/propTypes", ["gunpowder/constants/widgets/picker", "constants/message"], function(
  LIST_PICKER_CONSTANTS,
  msgConstants
) {
  "use strict";

  const {TOGGLE_STATES: LIST_PICKER_TOGGLE_STATES} = LIST_PICKER_CONSTANTS;

  const {FAQ_SUGGESTION_SOURCES} = msgConstants;

  const MESSAGE_PROP_TYPE = PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    body: PropTypes.string,
    redacted: PropTypes.bool,
    isCustomerMsg: PropTypes.bool.isRequired,
    createdTs: PropTypes.number.isRequired,
    author: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    }),
    suggestedFaqs: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        faqSource: PropTypes.oneOf([
          FAQ_SUGGESTION_SOURCES.ANSWER_BOT,
          FAQ_SUGGESTION_SOURCES.CUSTOM_BOT
        ])
      })
    )
  }).isRequired;

  const OPTION_PROP_TYPE = PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.string
  });

  const USER_INPUT_PROP_TYPE = PropTypes.shape({
    type: PropTypes.string.isRequired,
    value: PropTypes.string,
    options: PropTypes.arrayOf(OPTION_PROP_TYPE),
    disabled: PropTypes.bool,
    label: PropTypes.string,
    required: PropTypes.bool,
    skipLabel: PropTypes.string,
    placeholder: PropTypes.string,
    errorMsg: PropTypes.string,
    listPicker: PropTypes.shape({
      toggleState: PropTypes.oneOf([
        LIST_PICKER_TOGGLE_STATES.CLOSED,
        LIST_PICKER_TOGGLE_STATES.OPENED,
        LIST_PICKER_TOGGLE_STATES.RESIZING
      ])
    })
  });

  return {
    MESSAGE_PROP_TYPE,
    USER_INPUT_PROP_TYPE
  };
});
