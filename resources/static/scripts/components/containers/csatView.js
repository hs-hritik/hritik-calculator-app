/**
 * Container component for the CSAT view.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 14, 2017
 */

define ("components/containers/csatView",
  [
    "components/csatView",
    "actions/csatView"
  ],
  function (CsatView, csatViewActions) {
    "use strict";

    const mapStateToProps = (state) => {
      const {rating, review} = state.csatView;

      return {
        rating,
        review,
        text: state.ui.text
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onSubmitCsat: () => {
          dispatch (csatViewActions.submitCsat ());
        },
        onUpdateCsatRating: (rating) => {
          dispatch (csatViewActions.updateCsatRating (rating));
        },
        onUpdateCsatReview: (review) => {
          dispatch (csatViewActions.updateCsatReview (review));
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (CsatView);
  }
);