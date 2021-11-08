module.exports = (() => {
  var path = require('path');
  var os = require('os');

  const home_directory = os.homedir();
  const config = {
    directory_name: '.jira-cli',
    config_file_name: 'config.json',
    certificate_file_name: 'jira.crt'
  };

  function _getConfigFilePath() {
    return process.env['JIRA_CONFIG'] || path.join(_getConfigDirectory(), config.config_file_name);
  }

  function _getCertificateFilePath() {
    return process.env['JIRA_CERT'] || path.join(_getConfigDirectory(), config.certificate_file_name);
  }

  function _getConfigDirectory() {
    return path.join(home_directory, config.directory_name);
  }

  return {
    getConfigFilePath: _getConfigFilePath,
    getConfigDirectory: _getConfigDirectory,
    getCertificateFilePath: _getCertificateFilePath
  };
})();
