module.exports = (() => {
  var path = require('path');

  const home_directory = process.cwd();
  const config_file = {
    directory_name: '.jira-cli',
    file_name: 'config.json'
  };

  function _getConfigFilePath() {
    return process.env['JIRA_CONFIG'] || path.join(_getConfigDirectory(), config_file.file_name);
  }

  function _getConfigDirectory() {
    return path.join(home_directory, config_file.directory_name);
  }

  return {
    getConfigFilePath: _getConfigFilePath,
    getConfigDirectory: _getConfigDirectory
  };
})();