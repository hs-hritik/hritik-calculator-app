/**
 * Container component for the FAQ view.
 * "Connects" store to the dumb component.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created June 9, 2017
 */

define ("components/containers/faqView",
  [
    "normalizr",
    "components/faqView",
    "actions/faqView",
    "helpers/entitySchema"
  ],
  function (normalizr, FaqView, faqViewActions, entitySchema) {
    "use strict";

    const {denormalize} = normalizr;

    const mapStateToProps = (state) => {
      const activeFaqId = state.faqView.activeFaqId;
      const faq = denormalize (activeFaqId, entitySchema.faq, state.entities);
      // @TODO Handle language
      const faqEn = faq.translations.en;
      const {title, body} = faqEn;

      return {
        title,
        body,
        text: state.ui.text
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onFaqFeedbackClick: (feedback) => {
          dispatch (faqViewActions.submitFaqFeedback (feedback));
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (FaqView);
  }
);