const DOMAIN = "{{ENV_WEB_CHAT_ROOT}}";

require.config ({
  baseUrl: `${DOMAIN}/scripts/`,
  urlArgs: "v=2.28.1",
  paths: {
    libs: `${DOMAIN}/libs/`,
    reduxThunk: `${DOMAIN}/libs/redux-thunk`,
    uaParser: `${DOMAIN}/libs/ua-parser`,
    axios: `${DOMAIN}/libs/axios`
  }
});
