/*global console*/
module.exports = function () {
  var request = require('superagent');
  const utils = require('../utils');
  var config = require('../../lib/config');

  var assign = {
    query: null,
    table: null,
    to: function (ticket, assignee) {
      this.query = 'rest/api/2/issue/' + ticket + '/assignee';
      request
        .put(config.auth.url + this.query)
        .send({ 'name': assignee })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Basic ' + config.auth.token)
        .end((err, res) => {
          if (!res.ok) {
            const errorMessages = utils.extractErrorMessages(res).join('\n')
            return console.log(errorMessages)
          }
          return console.log('Issue [' + ticket + '] assigned to ' + assignee + '.')
        })
    },
    me: function (ticket) {
      this.to(ticket, config.auth.user);
    }
  };
  return assign;
}();
