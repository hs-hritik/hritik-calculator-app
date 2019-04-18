const DOMAIN = "{{ENV_WEB_CHAT_ROOT}}";

require.config ({
  baseUrl: `${DOMAIN}/scripts/`,
  urlArgs: "v=2.21.0",
  paths: {
    libs: `${DOMAIN}/libs/`,
    reduxThunk: `${DOMAIN}/libs/redux-thunk`,
    uaParser: `${DOMAIN}/libs/ua-parser`
  }
});
