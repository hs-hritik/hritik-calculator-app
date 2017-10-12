/**
 * Container component for the CSAT view.
 * @author Manish Garg <manish@helpshift.com>
 * @created Aug 14, 2017
 */

define ("components/containers/csatView",
  [
    "components/csatView",
    "actions/csatView",
    "actions/appState"

  ],
  function (CsatView, csatViewActions, appStateActions) {
    "use strict";

    const mapStateToProps = (state) => {
      const {rating, review, completed} = state.csatView;

      return {
        rating,
        review,
        completed,
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
        },
        onCloseConversation: () => {
          dispatch (appStateActions.closeConversation ());
        }

      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (CsatView);
  }
);