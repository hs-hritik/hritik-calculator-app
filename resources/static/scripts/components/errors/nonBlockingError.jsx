/**
 * Component to display error in a non blocking manner.
 * @author Ayush Sachdeva <ayush.sachdeva@helpshift.com>
 * @created Nov 16, 2019
 */

define (
  "components/errors/nonBlockingError",
  function () {
    "use strict";

    const NonBlockingError = () => (
      <div className="hs-non-blocking-error">
        <i className="ion-alert-circled hs-non-blocking-error__icon" />
          Something went wrong. Please try reloading.
      </div>
    );

    return NonBlockingError;
  }
);