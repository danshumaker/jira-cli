/*global requirejs,console,define,fs*/
module.exports = function () {
  var sslRequest = require('../../lib/ssl_request');
  var config = require('../../lib/config');

  var comment = {
    query: null,
    table: null,
    to: function (issue, comment, cb) {
      this.query = 'rest/api/latest/issue/' + issue + '/comment';
      sslRequest.post(config.auth.url + this.query).send({
        body: comment
      }).end((err, res) => {
        try {
          if (!res.ok) {
            return console.log((res.body.errorMessages || [res.error]).join('\n'));
          }
        } catch(e) {
          if (err && err.message) {
            return cb(`A connection error occurred: Error Number: ${err.errno} | Message: ${err.message}`)
          }
          return cb(e);
        }

        return console.log('Comment to issue [' + issue + '] was posted!.');
      });
    },
    show: function (issue, cb) {
      var that = this,
        i = 0;
      this.query = 'rest/api/latest/issue/' + issue + '/comment';
      sslRequest
        .get(config.auth.url + this.query)
        .end((err, res) => {
          try {
            if (!res.ok) {
              return console.log(res.body.errorMessages.join('\n'));
            }
          } catch(e) {
            if (err && err.message) {
              return cb(`A connection error occurred: Error Number: ${err.errno} | Message: ${err.message}`)
            }
            return cb(e);
          }

          if (res.body.total > 0) {
            for (i = 0; i < res.body.total; i += 1) {
              var updated = new Date(res.body.comments[i].updated);
              updated = ' (' + updated + ')';
              console.log('\n' + res.body.comments[i].author.displayName.cyan + updated.grey);
              console.log(res.body.comments[i].body);
            }
          } else {
            return console.log('There are no comments on this issue.');
          }
        });
    }
  };
  return comment;
}();
