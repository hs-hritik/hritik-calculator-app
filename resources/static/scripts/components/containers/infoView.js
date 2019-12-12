/**
 * Info View Container.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Apr 10, 2018
 */

define("components/containers/infoView", ["components/infoView"], function(InfoView) {
  "use strict";

  // Note: This is not being used anywhere right now.
  // It will be used when we will move the errors to one generic place.
  const mapStateToProps = (state) => {
    const {
      chatView: {loading}
    } = state;

    return {
      loading
    };
  };

  return ReactRedux.connect(mapStateToProps)(InfoView);
});
