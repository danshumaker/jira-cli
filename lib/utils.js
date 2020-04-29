
module.exports = (() => {
  const fs = require('fs');
  const _url = require('url');

  function _loadFromFile(path) {
    return fs.readFileSync(path, 'utf-8');
  }

  function _isFileExists(path) {
    return fs.existsSync(path);
  }

  function _createDirectory(directory) {
    if (!_isFileExists(directory)) {
      fs.mkdir(directory, function (e) {
        console.log(e);
      });
    }
  }

  function _saveToFile(path, content) {
    fs.writeFileSync(path, content);
  }

  function _deleteDirectory(directoryPath) {
    if (fs.existsSync(directoryPath)) {
      fs.rmdirSync(directoryPath);
    }
  }

  function _deleteFile(pathTofile) {
    if (_isFileExists(pathTofile)) fs.unlinkSync(pathTofile);
  }

  function _extractErrorMessages (response) {
    const { errors, messages } = typeof response === 'string' ? JSON.parse(response).body : response.body;

    function convertErrorsToArray (errors) {
      if (!errors) {return [];}

      function formatErrorMessage (element) {
        return `${element}: ${errors[element]}`;
      }

      return Object.keys(errors).map(formatErrorMessage);
    }

    return (messages && messages.length) ? messages : convertErrorsToArray(errors);
  }

  return {
    url: _url,
    extractErrorMessages: _extractErrorMessages,
    isFileExists: _isFileExists,
    loadFromFile: _loadFromFile,
    deleteDirectory: _deleteDirectory,
    deleteFile: _deleteFile,
    saveToFile: _saveToFile,
    createDirectory: _createDirectory
  };
})();
