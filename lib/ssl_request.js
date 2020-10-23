module.exports = (() => {
  let config = require('./config');
  let request = require('superagent');

  var _buildRequest = function(verb) {
    if (config.use_self_signed_certificate) {
      let ca = require('./ca');
      return argument =>
        request[verb](argument)
          .ca(ca)
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Basic ' + config.auth.token);
    } else {
      return argument =>
        request[verb](argument)
          .set('Content-Type', 'application/json')
          .set('Authorization', 'Basic ' + config.auth.token);
    }
  };

  return {
    get: _buildRequest('get'),
    post: _buildRequest('post'),
    put: _buildRequest('put'),
    delete: _buildRequest('delete')
  };
})();
