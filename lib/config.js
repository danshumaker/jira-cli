/*global path, define*/
define([
  'path',
  'fs',
  'os',
  './initial_config'
], function (path, fs, os, initialConfig) {

  const {directory_name, file_name} = initialConfig.config_file;
  let _config = {};

  createDirectory(_getConfigDirectory());
  _load();

  function _getConfigPath() {
    return process.env['JIRA_CONFIG'] || path.join(_getConfigDirectory(), file_name);
  }

  function _update(key, value) {
    _config[key] = value;
  }

  function _loadConfigFromFile(configFile, defConfig) {
    if (isFileExists(configFile)) {
//gs      console.log("Load config from file: " + configFile);
      return _createConfig(loadDataFromFile(configFile));
    }
    return defConfig;
  }

  function _loadInitialFromTemplate(template) {
    _config = _loadConfigFromFile(template, initialConfig);
    return true;
  }

  function _isConfigExist() {
    return _config.auth.url !== undefined
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
      console.error('Ops! Seems like your ' + _getConfigPath() + ' is out of date. Please reset you configuration.');
      return {};
    }
    return config;
  }

  function _load() {
    _config = _loadConfigFromFile(_getConfigPath(), initialConfig);
    return _isConfigExist()
  }

  function _isLoaded() {
    return _isConfigExist();
  }

  function _save() {
    saveToFile(_getConfigPath(), JSON.stringify(_config, null, 2));
  }

  function _clear() {
    deleteFile(_getConfigPath());
    deleteDirectory(path.basename(_getConfigPath()));
  }

  function loadDataFromFile(path) {
    return fs.readFileSync(path, 'utf-8')
  }

  function _getConfigDirectory() {
    const homeDirectory = process.env.mode === 'debug' ? process.cwd() : os.homedir();
    return path.join(homeDirectory, directory_name);
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
