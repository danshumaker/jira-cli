module.exports = (() => {
  let config = require('./config');  
  let request = require('superagent');
  const fs = require('fs');
  let ca = fs.readFileSync(process.env['JIRA_CERT']);
  
  var _buildRequest = function(verb)
  {
    return argument => request[verb](argument)
            .ca(ca)
            .set('Content-Type', 'application/json')
            .set('Authorization', 'Basic ' + config.auth.token);
  }

  return {
    get: _buildRequest("get"),
    post: _buildRequest("post"),
    put: _buildRequest("put"),
    delete: _buildRequest("delete")
  };
})();
