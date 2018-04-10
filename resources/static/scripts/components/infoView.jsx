/**
 * Info View Component.
 * This component is used to render full screen loader, error messages etc.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Apr 10, 2018
 */

define ("components/infoView",
  [
    "gunpowder/utils/classes"
  ],
  function (classes) {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "InfoView",
      propTypes: {
        loading: PropTypes.bool
      },

      render () {
        return (
          <div className="hs-info-view">
            {this._renderLoader ()}
          </div>
        );
      },

      /**
       * Render loader
       */
      _renderLoader () {
        if (!this.props.loading) {
          return null;
        }

        const loaderClasses = classes (
          "ion-load-b",
          "ion--spinning",
          "hs-info-view__loader"
        );

        return (
          <div>
            <i className={loaderClasses} />
          </div>
        );
      }
    });
  }
);
