/*global path, define*/
module.exports = function () {
  var settings = require('./settings');

  var initialConfig = require('./initial_config');

  var utils = require('./utils');
  let _data = {};
  const configDir = settings.getConfigDirectory();
  const configFilePath = settings.getConfigFilePath();

  _ensureConfig();

  _load();

  function _ensureConfig() {
    utils.createDirectory(configDir);
  }

  function _update(key, value) {
    _data[key] = value;
  }

  function _loadConfigFromFile(configFile, defConfig) {
    if (utils.isFileExists(configFile)) {
      return _createConfig(utils.loadFromFile(configFile));
    }

    return defConfig;
  }

  function _loadInitialFromTemplate(template) {
    _data = _loadConfigFromFile(template, initialConfig);
    return true;
  }

  function formatToNewAuth(auth) {
    const { url, token } = auth
    if (url) {
      let { host, pathname, protocol } = new URL(url)
      pathname = pathname.endsWith('/') ? pathname.slice(0, pathname.length - 1) : pathname

      return { host: host + pathname, protocol: protocol, token: token }
    }
    return auth
  }

  function _createConfig(configFileContent) {
    let configObject = JSON.parse(configFileContent);
    let config = {
      auth: configObject.auth,
      authNew: formatToNewAuth(configObject.auth),
      options: configObject.options,
      custom_jql: configObject.custom_jql,
      custom_alasql: configObject.custom_alasql,
      user_alias: configObject.user_alias,
      edit_meta: configObject.edit_meta,
      default_create: configObject.default_create,
      use_self_signed_certificate: configObject.use_self_signed_certificate
    };

    if (!config.options || !config.options["jira_stop"]) {
      console.error('Ops! Seems like your ' + configFilePath + ' is out of date. Please reset you configuration.');
      return {};
    }

    return config;
  }

  function _load() {
    _data = _loadConfigFromFile(configFilePath, initialConfig);
    return _isLoaded();
  }

  function _isLoaded() {
    return _data.auth.url !== undefined;
  }

  function _save() {
    utils.saveToFile(configFilePath, JSON.stringify(_data, null, 2));
  }

  function _clear() {
    utils.deleteFile(configFilePath);
    utils.deleteDirectory(configDir);
  }

  const api = {
    save: _save,
    load: _load,
    update: _update,
    clear: _clear,
    loadInitialFromTemplate: _loadInitialFromTemplate,
    isLoaded: _isLoaded
  }
  return { ..._data, ...api };
}();
