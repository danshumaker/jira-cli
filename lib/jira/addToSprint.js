//https://jira.mypaytm.com/rest/api/2/issue/MPP-509/editmeta
//https://developer.atlassian.com/jiradev/jira-apis/jira-rest-apis/jira-rest-api-tutorials/jira-rest-api-example-edit-issues

/*global requirejs,console,define,fs*/
module.exports = function () {
  const promptly = require('promptly');

  var sslRequest = require('../../lib/ssl_request');

  var config = require('../../lib/config');

  var sprint = require('./sprint');

  var ls = require('./ls');

  var async = require('async');

  function ask(question, callback, yesno, values) {
    var that = this,
      issueTypes = [],
      i = 0;

    if (values && values.length > 0) {
      for (i; i < values.length; i++) {
        issueTypes.push('(' + values[i][0] + ') ' + values[i][1]);
      }

      console.log(issueTypes.join('\n'));
    }

    promptly
      .prompt(question)
      .then(answer => {
        if (answer.length > 0) {
          callback(answer);
        } else {
          if (yesno) {
            callback(false);
          } else {
            that.ask(question, callback);
          }
        }
      })
      .catch(e => {
        if(e && e.message === 'canceled') {
          console.log('\nInput cancelled');
        } else {
          console.log('\nError: ' + e.toString());
        }
      });
  }

  var addToSprint = {
    addIssuesViaKey: function addIssuesViaKey(options, cb) {
      if (options.rapidboard || options.sprint) {
        sprint(options.rapidboard, options.sprint, function (sprintData) {
          ask('Please enter the sprint', function (sprintId) {
            console.log('here');
            addToSprint(sprintId, options.add, cb);
          }, false, sprintData);
        });
      } else if (options.jql) {
        addAllJqlToSprint(options.sprintId, options.jql, cb);
      } else if (options.sprintId) {
        addToSprint(options.sprintId, options.add, cb);
      }
    },
    addAllJqlToSprint: function addAllJqlToSprint(options, cb) {
      if (!options.jql || !options.sprintId) {
        return cb(new Error('jql or sprint id not found'));
      }

      ls.jqlSearch(options.jql, {}, function (err, issues) {
        ask('Are you sure you want to add all above issues in sprint id ' + options.sprintId + ' [y/N]: ', function (answer) {
          if (answer !== 'y') {
            return cb('no issues were added to sprint');
          }

          async.eachSeries(issues, function (eachIssue, scb) {
            addToSprint(options.sprintId, eachIssue.key, scb);
          }, function () {
            return cb();
          });
        }, true);
      });
    }
  };

  function addAllJqlToSprint(sprintId, jql, cb) {
    ls.jqlSearch(jql, {}, function (err, issues) {
      ask('Are you sure you want to add all above issues in sprint id ' + sprintId + ':', function (answer) {
        console.log(answer);
      }, true);
    });
  }

  function addToSprint(sprintId, projIsssue, cb) {
    var data = {
      'fields': {}
    };

    if (!config.edit_meta || !config.edit_meta.sprint) {
      return cb('sprint field not found');
    }

    data.fields[config.edit_meta.sprint.name] = config.edit_meta.sprint.type === 'number' ? Number(sprintId) : sprintId;
    sslRequest.put(config.auth.url + '/rest/api/2/issue/' + projIsssue).send(data).end((err, res) => {
      try {
        if (!res.ok) {
          console.log('Error getting rapid boards. HTTP Status Code: ' + res.status);
          console.dir(res.body);
          return cb();
        }
      } catch(e) {
        if (err && err.message) {
          return cb(`A connection error occurred: Error Number: ${err.errno} | Message: ${err.message}`)
        }
        return cb(e);
      }

      console.log('Added [' + projIsssue + '] to sprint with id ' + sprintId);
      return cb();
    });
  } //exporting from file


  return addToSprint;
}();
