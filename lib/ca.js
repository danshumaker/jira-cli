module.exports = (() => {
  const settings = require('./settings');
  const fs = require('fs');
  const ca = fs.readFileSync(settings.getCertificateFilePath());
  return ca;
})();
