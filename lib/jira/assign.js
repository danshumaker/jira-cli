/*global requirejs,console,define,fs*/
module.exports = function () {
  var request = require('superagent');

  var config = require('../../lib/config');

  var assign = {
    query: null,
    table: null,
    to: function (ticket, assignee) {
      this.query = 'rest/api/2/issue/' + ticket + '/assignee';
      request.put(config.auth.url + this.query).send({
        'accountId': assignee
      }).set('Content-Type', 'application/json').set('Authorization', 'Basic ' + config.auth.token).end((err, res) => {
        if (!res.ok) {
          return console.log((res.body.errorMessages || [res.error]).join('\n'));
        }

        return console.log('Issue [' + ticket + '] assigned to ' + assignee + '.');
      });
    },
    me: function (ticket) {
      this.to(ticket, config.auth.user);
    }
  };
  return assign;
}();