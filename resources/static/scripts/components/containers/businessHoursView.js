/**
 * Business Hours View Container.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 3, 2017
 */

define("components/containers/businessHoursView", [
  "components/businessHoursView",
  "actions/businessHours"
], function(BusinessHoursView, businessHoursActions) {
  "use strict";

  const mapStateToProps = (state) => {
    const {
      contactFormDetails,
      offlineBehaviour,
      contactFormDisabled,
      contactFormSubmitted,
      submitInProgress
    } = state.businessHoursViewState;

    return {
      contactFormDetails,
      text: state.ui.text,
      offlineBehaviour,
      contactFormDisabled,
      contactFormSubmitted,
      submitInProgress,
      fullPrivacyEnabled: state.appState.fullPrivacyEnabled
    };
  };

  const mapDispatchToProps = (dispatch) => {
    return {
      onChangeBusinessHoursContactFormDetails(field, value) {
        dispatch(businessHoursActions.setBusinessHoursContactFormDetails({field, value}));
      },
      onSubmitBusinessHoursContactForm() {
        dispatch(businessHoursActions.submitBusinessHoursContactForm());
      },
      onFilesChange(files) {
        dispatch(businessHoursActions.addAttachments(files));
      },
      onRemoveAttachment(attachmentId) {
        dispatch(businessHoursActions.removeAttachment(attachmentId));
      }
    };
  };

  return ReactRedux.connect(mapStateToProps, mapDispatchToProps)(BusinessHoursView);
});
