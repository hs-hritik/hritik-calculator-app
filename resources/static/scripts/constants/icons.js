/**
 * Icon related constants.
 * @author Vaibhav Kakade <vaibhavkakade@helpshift.com>
 * @created Aug 28, 2017
 */

define ("constants/icons",
  function () {
    "use strict";

    /*eslint-disable */
    const FILE_ICON = `
      <svg width="19px" height="23px" viewBox="0 0 19 23" version="1.1"
            xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <title>Combined Shape</title>
        <defs></defs>
        <g id="Symbols" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g id="Agent-Message/-Name-+-PDF" transform="translate(-21.000000, -55.000000)" fill="#67A2E6">
            <g id="Group-2" transform="translate(10.600000, 42.000000)">
              <g id="Group" transform="translate(10.480433, 5.200000)">
                <path d="M12.674728,8.20000002 L2.77852317,8.20000002 C1.67410161,8.20000002 0.775012551,9.09758796 0.775012551,10.2048188 L0.775012551,28.3461506 C0.775012551,29.4551902 1.67201481,30.3509693 2.77852317,30.3509693 L15.9439861,30.3509693 C17.0484077,30.3509693 17.9474968,29.4533814 17.9474968,28.3461506 L17.9474968,13.4467946 L12.674728,8.20000002 Z" id="Combined-Shape"></path>
              </g>
            </g>
          </g>
        </g>
      </svg>
    `;
    const DOWNLOAD_ICON = `
      <svg width="12px" height="12px" viewBox="0 0 10 10" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <title>Download</title>
        <defs></defs>
        <g id="Symbols" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
          <g id="Agent-Message/-Name-+-PDF" transform="translate(-47.000000, -70.000000)">
            <g id="Download" transform="translate(47.554688, 70.546533)">
              <circle id="Oval-3" stroke="#2E9952" stroke-width="0.75" fill-opacity="0.1" fill="#E6FAEB" cx="4.17703274" cy="4.17703274" r="4.17703274"></circle>
              <g id="Group-12" transform="translate(1.445777, 2.001845)">
                  <path d="M3.59578015,3.37574674 L1.39520724,5.4470312 C1.19072923,5.64035108 1.33678495,5.9717566 1.61915935,5.9717566 L1.61915935,5.9717566 C1.70679279,5.9717566 1.78468917,5.94413947 1.84311146,5.87969951 L4.25789943,3.59668375 C4.38448106,3.47700954 4.38448106,3.28368965 4.25789943,3.16401544 L1.85284851,0.871793971 C1.79442622,0.816559719 1.70679279,0.779736884 1.6288964,0.779736884 L1.6288964,0.779736884 C1.33678495,0.779736884 1.20046628,1.1111424 1.40494429,1.30446228 L3.59578015,3.37574674" id="Carrot" fill="#2E9952" fill-rule="nonzero" transform="translate(2.826199, 3.375747) rotate(-270.000000) translate(-2.826199, -3.375747) "></path>
                  <path d="M2.76320291,3.79260131 L2.76320291,0.272149208" id="Line-2" stroke="#299A4F" stroke-width="0.75" stroke-linecap="round" stroke-linejoin="round"></path>
              </g>
            </g>
          </g>
        </g>
      </svg>
    `;
    /*eslint-enable */

    return {
      FILE_ICON,
      DOWNLOAD_ICON
    };
  });
