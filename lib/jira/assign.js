/*global console*/
module.exports = function () {
  var sslRequest = require('../../lib/ssl_request');
  const utils = require('../utils');
  var config = require('../../lib/config');

  const UNASSIGN_DEFAULT_TEXT = 'null';

  var assign = {
    query: null,
    table: null,
    to: function (ticket, assignee, cb) {
      const unassignText = config.assign && config.assign.unassignText ? config.assign.unassignText : UNASSIGN_DEFAULT_TEXT;
      if(assignee === unassignText) {
        assignee = null;
      }
      this.query = 'rest/api/2/issue/' + ticket + '/assignee';
      sslRequest
        .put(config.auth.url + this.query)
        .send({ 'name': assignee })
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Basic ' + config.auth.token)
        .end((err, res) => {
          try {
            if (!res.ok) {
              const errorMessages = utils.extractErrorMessages(res).join('\n');
              return console.log(errorMessages);
            }
          } catch(e) {
            if (err && err.message) {
              return cb(`A connection error occurred: Error Number: ${err.errno} | Message: ${err.message}`)
            }
            return cb(e);
          }
          return console.log('Issue [' + ticket + '] assigned to ' + assignee + '.');
        });
    },
    me: function (ticket, cb) {
      this.to(ticket, config.auth.user, cb);
    }
  };
  return assign;
}();
