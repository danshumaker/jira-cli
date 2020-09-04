/*global requirejs,console,define,fs*/
module.exports = function () {
  var sslRequest = require('../../lib/ssl_request');;

  var config = require('../../lib/config');

  var assign = {
    query: null,
    table: null,
    to: function (ticket, assignee) {
      this.query = 'rest/api/2/issue/' + ticket + '/watchers';
      sslRequest.post(config.auth.url + this.query).send('"' + assignee + '"').end((err, res) => {
        if (!res.ok) {
          return console.log((res.body.errorMessages || [res.error]).join('\n'));
        }

        return console.log('Added ' + assignee + ' as watcher to [' + ticket + '] ' + '.');
      });
    },
    me: function (ticket) {
      this.to(ticket, config.auth.user);
    }
  };
  return assign;
}();