/**
 * Renders error message
 * @author Ayush Sachdeva <ayush.sachdeva@helpshift.com>
 * @created Nov 05, 2019
 */

define("components/errors/appError", function() {
  "use strict";

  const AppError = () => (
    <div className="hs-app-error">
      <div>Something went wrong.</div>
      <div className="hs-app-error__instructions">Please try reloading.</div>
    </div>
  );

  return AppError;
});
