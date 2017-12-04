/**
 * Common helpers. Contains common functions, etc applicable to more than one
 * part of the app.
 * @author Prasenjit Sharan <prasenjit@helpshift.com>
 * @created 4 Dec, 2017
 */

define ("helpers/common",
  [
    "store"
  ],
  function (store) {
    "use strict";

    /**
     * Determine whether out of business hours logic is applicable based on if
     * the feature is enabled and the current time falls in the out of business
     * hours range.
     * @returns {boolean} - true if it's out of business hours.
     */
    const isOutOfBusinessHours = () => {
      const {
        businessHoursViewState: bhState
      } = store.getState ();

      return bhState.businessHoursEnabled && !bhState.inBusinessHours;
    };

    return {
      isOutOfBusinessHours
    };
  });
