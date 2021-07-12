/*global requirejs,console,define,fs*/
module.exports = function () {
  var sslRequest = require('../../lib/ssl_request');;

  var config = require('../../lib/config');

  var assign = {
    query: null,
    table: null,
    to: function (ticket, assignee, cb) {
      this.query = 'rest/api/2/issue/' + ticket + '/watchers';
      sslRequest.post(config.auth.url + this.query).send('"' + assignee + '"').end((err, res) => {
        try {
          if (!res.ok) {
            return console.log((res.body.errorMessages || [res.error]).join('\n'));
          }
        } catch(e) {
          return cb(e);
        }

        return console.log('Added ' + assignee + ' as watcher to [' + ticket + '] ' + '.');
      });
    },
    me: function (ticket, cb) {
      this.to(ticket, config.auth.user, cb);
    }
  };
  return assign;
}();
