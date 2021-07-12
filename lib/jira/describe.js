/*global requirejs,console,define,fs*/
module.exports = function () {
  var sslRequest = require('../../lib/ssl_request');

  var Table = require('cli-table');

  var openurl = require('openurl');

  var url = require('url');

  var config = require('../../lib/config');

  var describe = {
    query: null,
    priority: null,
    table: null,
    getIssueField: function (field, cb) {
      var that = this;
      sslRequest.get(config.auth.url + this.query + '?fields=' + field).end((err, res) => {
        try {
          if (!res.ok) {
            return console.log(res);
          }
        } catch(e) {
          if (err && err.message) {
            return cb(`A connection error occurred: Error Number: ${err.errno} | Message: ${err.message}`)
          }
          return cb(e);
        }

        if (res.body.fields) {
          if (typeof res.body.fields[field] === 'string') {
            console.log(res.body.fields[field]);
          } else {
            console.log(res.body.fields[field].name);
          }
        } else {
          console.log('Field does not exist.');
        }
      });
    },
    getIssue: function (cb) {
      var that = this;
      sslRequest.get(config.auth.url + this.query).end((err, res) => {
        try {
          if (!res.ok) {
            //return console.log(res.body.errorMessages.join('\n'));
            return console.log(res);
          }
        } catch(e) {
          if (err && err.message) {
            return cb(`A connection error occurred: Error Number: ${err.errno} | Message: ${err.message}`)
          }
          return cb(e);
        }

        that.table = new Table();
        that.priority = res.body.fields.priority;
        that.description = res.body.fields.description;

        if (!that.priority) {
          that.priority = {
            name: ''
          };
        }

        if (!that.description) {
          that.description = 'No description';
        }

        that.table.push({
          'Issue': res.body.key
        }, {
          'Summary': res.body.fields.summary
        }, {
          'Type': res.body.fields.issuetype.name
        }, {
          'Priority': that.priority.name
        }, {
          'Status': res.body.fields.status.name
        }, {
          'Reporter': res.body.fields.reporter.displayName + ' <' + res.body.fields.reporter.emailAddress + '> '
        }, {
          'Assignee': (res.body.fields.assignee ? res.body.fields.assignee.displayName : 'Not Assigned') + ' <' + (res.body.fields.assignee ? res.body.fields.assignee.emailAddress : '') + '> '
        }, {
          'Labels': res.body.fields.labels ? res.body.fields.labels.join(', ') : ''
        }, {
          'Subtasks': res.body.fields.subtasks.length
        }, {
          'Comments': res.body.fields.comment.total
        });
        console.log(that.table.toString());
        console.log('\r\n' + that.description + '\r\n');
      });
    },
    open: function (issue) {
      openurl.open(url.resolve(config.auth.url, 'browse/' + issue));
    },
    show: function (issue, field, cb) {
      this.query = 'rest/api/latest/issue/' + issue;

      if (field) {
        return this.getIssueField(field, cb);
      } else {
        return this.getIssue(cb);
      }
    }
  };
  return describe;
}();
