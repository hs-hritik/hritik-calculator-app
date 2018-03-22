/**
 * Container component for the FAQ view.
 * "Connects" store to the dumb component.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created June 9, 2017
 */

define ("components/containers/faqView",
  [
    "components/faqView",
    "actions/chatView"
  ],
  function (FaqView, chatViewActions) {
    "use strict";

    const mapStateToProps = (state) => {
      const {
        faqView: {
          activeFaq
        },
        ui: {
          text
        }
      } = state;

      // @TODO - Find a way to read faqs for given language
      // Currently reading only english faqs
      const {title, body} = activeFaq.translations.en;

      return {
        title,
        body,
        text
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