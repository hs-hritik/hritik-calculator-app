/**
 * Business Hours View.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 3, 2017
 */

define ("components/businessHoursView",
  [
    "components/commons/viewHeader",
    "components/commons/branding"
  ],
  function (ViewHeader, Branding) {
    "use strict";

    const PropTypes = React.PropTypes;

    return React.createClass ({
      displayName: "BusinessHoursView",
      propTypes: {
        browserIsMobile: PropTypes.bool,
        text: PropTypes.shape ({
          // @TODO :- Replace this with business hours header text
          chatViewHeader: PropTypes.string.isRequired
        }).isRequired,
        onMinimizeConversation: PropTypes.func
      },
      render () {
        const {text, browserIsMobile, onMinimizeConversation} = this.props;
        // @TODO :- Add following
        // 1] Add handlers
        // 2] Add final note

        return (
          <div className="hs-view">
            <ViewHeader title={text.chatViewHeader}
                        showCloseBtn={browserIsMobile}
                        onCloseBtnClick={onMinimizeConversation} />
            <div className="hs-view__content">
              <div className="hs-business-hours">
                <div>
                  <p>
                    We are currently out of business hours.
                  </p>

                  <div className="hs-form-field">
                    <div className="hs-form-field__label">Name</div>
                    <input type="text" />
                  </div>

                  <div className="hs-form-field">
                    <div className="hs-form-field__label">Email</div>
                    <input type="text" />
                  </div>

                  <div className="hs-form-field">
                    <div className="hs-form-field__label">Message</div>
                    <textarea className="hs-business-hours__message" />
                  </div>
                  <Branding text={text} />
                </div>

                <div className="hs-business-hours__submit-btn-wrapper">
                  <button className="hs-business-hours__submit-btn hs-button">Send</button>
                </div>
              </div>
            </div>
          </div>
        );
      }
    });
  }
);
