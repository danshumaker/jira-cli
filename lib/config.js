/*global path, define*/
define([
  'path',
  'fs',
  './settings',
  './initial_config'
], function (path, fs, settings, initialConfig) {

  const {directory_name, file_name} = settings.config_file;
  let _config = {};

  createDirectory(_getConfigDirectory());
  _load();

  function _getConfigFilePath() {
    return process.env['JIRA_CONFIG'] || path.join(_getConfigDirectory(), file_name);
  }

  function _update(key, value) {
    _config[key] = value;
  }

  function _loadConfigFromFile(configFile, defConfig) {
    if (isFileExists(configFile)) {
      return _createConfig(loadDataFromFile(configFile));
    }
    return defConfig;
  }

  function _loadInitialFromTemplate(template) {
    _config = _loadConfigFromFile(template, initialConfig);
    return true;
  }

  function _createConfig(configFileContent) {
    let configObject = JSON.parse(configFileContent);

    let config = {
      auth: configObject.auth,
      options: configObject.options,
      custom_jql: configObject.custom_jql,
      custom_alasql: configObject.custom_alasql,
      user_alias: configObject.user_alias,
      edit_meta: configObject.edit_meta,
      default_create: configObject.default_create
    };
    if (!config.options || !config.options["jira_stop"]) {
      console.error('Ops! Seems like your ' + _getConfigFilePath() + ' is out of date. Please reset you configuration.');
      return {};
    }
    return config;
  }

  function _load() {
    _config = _loadConfigFromFile(_getConfigFilePath(), initialConfig);
    return _isLoaded();
  }

  function _isLoaded() {
    return _config.auth.url !== undefined;
  }

  function _save() {
    saveToFile(_getConfigFilePath(), JSON.stringify(_config, null, 2));
  }

  function _getConfigDirectory() {
    return path.join(settings.home_directory, directory_name);
  }

  function _clear() {
    deleteFile(_getConfigFilePath());
    deleteDirectory(path.basename(_getConfigFilePath()));
  }

  function loadDataFromFile(path) {
    return fs.readFileSync(path, 'utf-8')
  }

  function isFileExists(directory) {
    return fs.existsSync(directory);
  }

  function createDirectory(directory) {
    if (!isFileExists(directory)) {
      fs.mkdir(directory, function (e) {
        console.log(e)
      });
    }
  }
  function saveToFile(path, content) {
    fs.writeFileSync(path, content);
  }

  function deleteDirectory(directoryPath) {
    if (fs.existsSync(directoryPath)) {
      fs.rmdirSync(directoryPath);
    }
  }

  function deleteFile(fileName) {
    fs.unlinkSync(fileName);
  }

  return {
    ..._config,
    save: _save,
    load: _load,
    update: _update,
    clear: _clear,
    loadInitialFromTemplate: _loadInitialFromTemplate,
    isLoaded: _isLoaded
  }
});
