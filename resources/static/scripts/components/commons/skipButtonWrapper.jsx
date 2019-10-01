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
        /**
         * Class name for skip button wrapper
         */
        className: PropTypes.string,

        /**
         * Skip Button Label
         */
        label: PropTypes.string,

        /**
         * Click handler for skip button
         */
        onClick: PropTypes.func,

        /**
         * Whether skip button is disabled
         */
        disabled: PropTypes.bool,

        /**
         * Data label for skip button
         */
        dataLabels: PropTypes.object,

        /**
         * Focus handler for skip button
         */
        onFocus: PropTypes.func
      },

      render () {
        const {
          className,
          label,
          onClick,
          disabled,
          dataLabels,
          onFocus
        } = this.props;

        const skipBtnClasses = classes (
          "hs-button",
          "hs-button--hollow",
          "hs-chat-footer__button",
          "hs-chat-footer__skip-btn"
        );

        return (
          <div className={className}>
            <button className={skipBtnClasses}
                    onClick={onClick}
                    disabled={disabled}
                    tabIndex="0"
                    data-label={dataLabels.skipBtn}
                    onFocus={onFocus}>
              {label}
            </button>
          </div>
        );
      }
    });
  }
);
