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
    "actions/actionCreators",
    "helpers/entitySchema",
    "constants/activeView"
  ],
  function (normalizr, FaqView, faqViewActions, actionCreators, entitySchema,
    ACTIVE_VIEW) {
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
        onBackBtnClick: () => {
          dispatch (actionCreators.updateActiveView (ACTIVE_VIEW.CHAT));
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (FaqView);
  }
);