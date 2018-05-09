/**
 * Skip button wrapper component.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created May 23, 2018
 */

define ("components/commons/skipButtonWrapper",
  [
    "gunpowder/utils/classes"
  ],
  function (classes) {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "SkipButtonWrapper",
      propTypes: {
        className: PropTypes.string,
        label: PropTypes.string,
        onClick: PropTypes.func
      },

      render () {
        const {
          className,
          label,
          onClick
        } = this.props;

        const skipBtnClasses = classes (
          "hs-button",
          "hs-button--hollow",
          "hs-chat-footer__button",
          "hs-chat-footer__skip-btn"
        );

        return (
          <div className={className}>
            <button className={skipBtnClasses} onClick={onClick}>
              {label}
            </button>
          </div>
        );
      }
    });
  }
);
