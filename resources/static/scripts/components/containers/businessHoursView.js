/**
 * Business Hours View Container.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 3, 2017
 */

define ("components/containers/businessHoursView",
  [
    "components/businessHoursView",
    "actions/businessHours"
  ],
  function (BusinessHoursView, businessHoursActions) {
    "use strict";

    const mapStateToProps = (state) => {
      const {contactFormDetails, offlineBehaviour} = state.businessHoursViewState;
      return {
        contactFormDetails,
        text: state.ui.text,
        offlineBehaviour
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onChangeBusinessHoursContactFormDetails (field, value) {
          dispatch (businessHoursActions.setBusinessHoursContactFormDetails ({field, value}));
        },
        onSubmitBusinessHoursContactForm () {
          dispatch (businessHoursActions.submitBusinessHoursContactForm ());
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (BusinessHoursView);
  }
);
