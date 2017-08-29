/**
 * ViewWrapper Container.
 * @author Manish Garg <manish@helpshift.com>
 * @created June 9, 2017
 */

define ("components/containers/viewWrapper",
  ["components/viewWrapper"],
  function (ViewWrapper) {
    "use strict";

    const mapStateToProps = (state) => {
      return {
        activeView: state.appState.activeView,
        browserIsMobile: state.appState.browserIsMobile
      };
    };

    return ReactRedux.connect (mapStateToProps) (ViewWrapper);
  }
);
