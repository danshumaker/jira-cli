/*global requirejs,console,define,fs*/
module.exports = function () {
  var program = require('commander');

  var sslRequest = require('../../lib/ssl_request');;

  var Table = require('cli-table');

  var moment = require('moment');

  var config = require('../../lib/config');

  var worklog = {
    add: function (issue, timeSpent, comment, startedAt, cb) {
      var url = 'rest/api/latest/issue/' + issue + '/worklog';
      var formattedStart = moment(startedAt).format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ');
      sslRequest.post(config.auth.url + url).send({
        comment: comment,
        timeSpent: timeSpent,
        started: formattedStart
      }).end((err, res) => {
        try {
          if (!res.ok) {
            return console.log((res.body.errorMessages || [res.error]).join('\n'));
          }
        } catch(e) {
          return cb(e);
        }

        return console.log('Worklog to issue [' + issue + '] was added!.');
      });
    },
    show: function (issue, cb) {
      var url = 'rest/api/latest/issue/' + issue + '/worklog';
      sslRequest.get(config.auth.url + url).end((err, res) => {
        try {
          if (!res.ok) {
            return console.log(res.body.errorMessages.join('\n'));
          }
        } catch(e) {
          return cb(e);
        }

        if (res.body.total == 0) {
          console.log('No work yet logged');
          return;
        }

        var tbl = new Table({
            head: ['Date', 'Author', 'Time Spent', 'Comment']
          }),
          worklogs = res.body.worklogs;

        for (i = 0; i < worklogs.length; i++) {
          var startDate = worklogs[i].created,
            author = worklogs[i].author.displayName,
            timeSpent = worklogs[i].timeSpent,
            comment = worklogs[i].comment || '';

          if (comment.length > 50) {
            comment = comment.substr(0, 47) + '...';
          }

          tbl.push([startDate, //TODO format date
            author, timeSpent, comment]);
        }

        console.log(tbl.toString());
      });
    }
  };
  return worklog;
}();
