/*global requirejs,console,define,fs*/
module.exports = function () {
  var sslRequest = require('../../lib/ssl_request');

  var config = require('../../lib/config');

  var fix = {
    query: null,
    to: function (ticket, version, cb) {
      this.query = 'rest/api/2/issue/' + ticket;
      sslRequest.put(config.auth.url + this.query).send({
        'update': {
          'fixVersions': [{
            'set': [{
              'name': version
            }]
          }]
        }
      }).end((err, res) => {
        try {
          if (!res.ok) {
            return console.log((res.body.errorMessages || [res.error]).join('\n'));
          }
        } catch(e) {
          return cb(e);
        }

        return console.log('FixVersion [' + ticket + '] set to ' + version + '.');
      });
    },
    append: function (ticket, version, cb) {
      this.query = 'rest/api/2/issue/' + ticket;
      sslRequest.put(config.auth.url + this.query).send({
        'update': {
          'fixVersions': [{
            'add': {
              'name': version
            }
          }]
        }
      }).end((err, res) => {
        try {
          if (!res.ok) {
            return console.log((res.body.errorMessages || [res.error]).join('\n'));
          }
        } catch(e) {
          return cb(e);
        }

        return console.log('Appended FixVersion ' + version + ' to [' + ticket + '].');
      });
    }
  };
  return fix;
}();
