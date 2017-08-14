const DIST_DIR = "/dist";

require.config ({
  baseUrl: `${DIST_DIR}/scripts/`,
  paths: {
    libs: `${DIST_DIR}/libs/`,
    reduxThunk: `${DIST_DIR}/libs/redux-thunk`,
    normalizr: `${DIST_DIR}/libs/normalizr`
  }
});
