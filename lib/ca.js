
module.exports = (() => {
  const settings = require('./settings');
  const fs = require('fs');
  ca = fs.readFileSync(settings.getCertificateFilePath());
  return ca;
})();
