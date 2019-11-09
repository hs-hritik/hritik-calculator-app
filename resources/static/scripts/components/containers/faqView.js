/**
 * Container component for the FAQ view.
 * "Connects" store to the dumb component.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created June 9, 2017
 */

define ("components/containers/faqView",
  [
    "components/faqView",
    "actions/chatView",
    "extras/accessibility",
    "constants/activeView"
  ],
  function (FaqView, chatViewActions, ax, ACTIVE_VIEW) {
    "use strict";

    const mapStateToProps = (state) => {
      const {
        faqView: {
          activeFaq,
          loading,
          errorMsg
        },
        ui: {
          text
        }
      } = state;

      let title, body;

      if (activeFaq && activeFaq.translations && activeFaq.language) {
        const faq = activeFaq.translations [activeFaq.language];

        if (faq) {
          title = faq.title;
          body = faq.body;
        }
      }

      return {
        title,
        body,
        text,
        loading,
        errorMsg
      };
    };

    const mapDispatchToProps = (dispatch) => {
      return {
        onBackBtnClick: () => {
          ax.setFlatListActiveIndex (0);
          ax.setActiveView (ACTIVE_VIEW.CHAT);
          dispatch (chatViewActions.switchToChatView ());
        }
      };
    };

    return ReactRedux.connect (mapStateToProps, mapDispatchToProps) (FaqView);
  }
);