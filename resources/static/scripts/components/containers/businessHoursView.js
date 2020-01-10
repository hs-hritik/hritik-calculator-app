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
      appState: {attachmentsWhitelist},
      businessHoursViewState: {
        contactFormDetails,
        offlineBehaviour,
        contactFormDisabled,
        contactFormSubmitted,
        submitInProgress
      }
    } = state;

    return {
      contactFormDetails,
      text: state.ui.text,
      offlineBehaviour,
      contactFormDisabled,
      contactFormSubmitted,
      submitInProgress,
      fullPrivacyEnabled: state.appState.fullPrivacyEnabled,
      attachmentsWhitelist
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
