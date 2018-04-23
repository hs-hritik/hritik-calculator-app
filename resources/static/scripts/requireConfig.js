const DOMAIN = "{{ENV_WEB_CHAT_ROOT}}";

require.config ({
  baseUrl: `${DOMAIN}/scripts/`,
  urlArgs: "v=2",
  paths: {
    libs: `${DOMAIN}/libs/`,
    reduxThunk: `${DOMAIN}/libs/redux-thunk`,
    normalizr: `${DOMAIN}/libs/normalizr`,
    uaParser: `${DOMAIN}/libs/ua-parser`
  }
});
