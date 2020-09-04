
module.exports = (() => {
  const fs = require('fs');
  ca = fs.readFileSync(process.env['JIRA_CERT']);
  return ca;
})();
