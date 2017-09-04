const DOMAIN = "{{ENV_WEB_CHAT_ROOT}}";

require.config ({
  baseUrl: `${DOMAIN}/scripts/`,
  paths: {
    libs: `${DOMAIN}/libs/`,
    reduxThunk: `${DOMAIN}/libs/redux-thunk`,
    normalizr: `${DOMAIN}/libs/normalizr`
  }
});
