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
    "actions/chatView",
    "helpers/entitySchema",
    "constants/activeView"
  ],
  function (normalizr, FaqView, chatViewActions, entitySchema) {
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
          dispatch (chatViewActions.switchToChatView ());
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (FaqView);
  }
);