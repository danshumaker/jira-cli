/*global path, define*/
define([
  'path',
  'fs',
  'os',
  './default_config'
], function (path, fs, os, defaultConfig) {

  const {directory_name, file_name} = defaultConfig.config_file;

  createDirectory(_getConfigDirectory());

  let _config = {};

  function _getConfigPath() {
    return process.env['JIRA_CONFIG'] || path.join(_getConfigDirectory(), file_name);
  }

  function _update(key, value) {
    _config[key] = value;
  }

  function _save() {
    let pathConfigFile = _getConfigPath();
    saveToFile(pathConfigFile, JSON.stringify(_config, null, 2));
    console.log('Information stored!');
  }

  function _loadConfig() {
    _config = _load();
  }

  function _isConfigExist() {
    return _config === {}
  }

  function _load() {
    if (!fs.existsSync(_getConfigPath())) {
      return {};
    }

    let configObject = JSON.parse(loadFromFile(path));
    let config = {
      auth: configObject.auth,
      options: configObject.opcustom_jql = configObject.custom_jql,
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

  function loadFromFile(path) {
    return fs.readFileSync(path, 'utf-8')
  }

  function _getConfigDirectory() {
    const homeDirectory = process.env.mode ==='debug'? process.cwd() : os.homedir();
    return path.join(homeDirectory, directory_name);
  }

  function createDirectory(directory) {
    if (!fs.existsSync(directory)) {
      console.log("Making directory ", directory);
      fs.mkdir(directory, function (e) {
        console.log(e)
      });
    }
  }
  function saveToFile(path, content) {
    fs.writeFileSync(path, content);
  }

  return {
    save: _save,
    loadConfig: _loadConfig,
    update: _update,
    isConfigExist: _isConfigExist
  }
});

// let cfile = getCfgFile(defaultConfig.config_file.directory_name);
//
// if (fs.existsSync(cfile)) {
//   defaultConfig = JSON.parse(fs.readFileSync(cfile, 'utf-8'));
//   return defaultConfig;
// }
// return createCfgFile(defaultConfig.config_file.directory);
//
// function createCfgFile(dest) {
//   currentwd = process.cwd();
//   console.log("\n\nDid not find config file from JIRA_CONFIG environment variable or " + currentwd + dest + "/config.json.\n");
//   console.log("Setting one up in "+  currentwd + dest + "/config.json\n");
//   dest_dir = currentwd + dest;
//   cfile = dest_dir + '/config.json';
//   if (! fs.existsSync(dest_dir)) {
//     console.log("Making directory ", dest_dir);
//     fs.mkdir(dest_dir, function(e) { console.log(e)} );
//   }
//   return defaultConfig;
// }
