/**
 * Business Hours View.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Oct 3, 2017
 */

define ("components/businessHoursView",
  function () {
    "use strict";

    return React.createClass ({
      displayName: "BusinessHoursView",
      render () {
        // @TODO :- Add following
        // 1] View Header
        // 2] Branding
        // 3] Form Fields
        return (
          <div className="hs-view">
            <div className="hs-view__content">
              <div>
                We are currently out of business hours.
              </div>
            </div>
          </div>
        );
      }
    });
  }
);
