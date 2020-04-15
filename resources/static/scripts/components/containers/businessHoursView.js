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
      appState: {attachmentsWhitelist, showHeaderAvatar, appAvatarUrl},
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
      attachmentsWhitelist,
      showHeaderAvatar,
      appAvatarUrl
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
      onFilesChange(files, attachmentsWhitelist) {
        dispatch(businessHoursActions.addAttachments(files, attachmentsWhitelist));
      },
      onRemoveAttachment(attachmentId, attachmentsWhitelist) {
        dispatch(businessHoursActions.removeAttachment(attachmentId, attachmentsWhitelist));
      }
    };
  };

  return ReactRedux.connect(mapStateToProps, mapDispatchToProps)(BusinessHoursView);
});
