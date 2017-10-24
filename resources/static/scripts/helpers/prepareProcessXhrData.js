/**
 * Common prepare, process functions for XHRs
 * @author Aniket Hendre <aniket@helpshift.com>
 * @created Oct 18, 2017
 */

define (
  "helpers/prepareProcessXhrData",
  [
    "uaParser",
    "utils/browser"
  ],
  function (UAParser, browserUtils) {
    "use strict";

    const DESKTOP_DEVICE = "Desktop";
    // Possible device types that can be detected with UA string.
    const DEVICE_TYPES = ["console", "mobile", "tablet", "smarttv", "wearable", "embedded"];

    /**
     * Extracts Browser, OS & Device information based on user agent string &
     * prepares data for createIssue XHR.
     */
    const getPreparedDeviceInfo = (parentPageData) => {
      const uaParser = new UAParser ();
      const browser = uaParser.getBrowser ();
      const device = uaParser.getDevice ();
      const os = uaParser.getOS ();

      const result = {
        "os": os.name,
        "os-version": os.version,
        "browser": browser.name,
        "browser-version": browser.version,
        "browser-language": browserUtils.getLanguage (),
        "device-model": DEVICE_TYPES.indexOf (device.type) !== -1 ? device.model : DESKTOP_DEVICE,
        "page-title": parentPageData.title,
        "page-url": parentPageData.url
      };

      // This is done to avoid having multiple if conditions for each key.
      // if value is undefined then it is unnecessary key & hence it is removed.
      Object.keys (result).forEach ((key) => {
        if (typeof result [key] === "undefined") {
          delete result [key];
        }
      });

      return result;
    };

    return {
      getPreparedDeviceInfo
    };
  }
);
