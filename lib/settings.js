module.exports = (() => {
  var path = require('path');

  const homeDirectory = process.cwd();
  const config = {
    directoryName: '.jira-cli',
    configFileName: 'config.json',
    certificateFileName: 'jira.crt'
  };

  function _getConfigFilePath() {
    return process.env['JIRA_CONFIG'] || path.join(_getConfigDirectory(), config.configFileName);
  }

  function _getCertificateFilePath() {
    return process.env['JIRA_CERT'] || path.join(_getConfigDirectory(), config.certificateFileName);
  }

  function _getConfigDirectory() {
    return path.join(homeDirectory, config.directoryName);
  }

  return {
    getConfigFilePath: _getConfigFilePath,
    getConfigDirectory: _getConfigDirectory,
    getCertificateFilePath: _getCertificateFilePath
  };
})();
