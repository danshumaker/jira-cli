module.exports = (() => {
  var fs = require('fs');

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

  return {
    isFileExists: _isFileExists,
    loadFromFile: _loadFromFile,
    deleteDirectory: _deleteDirectory,
    deleteFile: _deleteFile,
    saveToFile: _saveToFile,
    createDirectory: _createDirectory
  };
})();