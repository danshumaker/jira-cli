/*global*/
module.exports = function (jira) {
  const program = require('commander');
  const utils = require('../utils');

  function printError (messages) {
    console.log(messages.join('\n'));
  }

  var create = {
    query: null,
    table: null,
    isSubTask: false,
    projects: [],
    priorities: [],
    answers: {
      fields: {}
    },
    ask: function (question, callback, yesno, values, answer) {
      var that = this,
          options = options || {},
          issueTypes = [],
          i = 0;

      if (answer || answer === false) {
        return callback(answer);
      }

      if (values && values.length > 0) {
        for (i; i < values.length; i++) {
          if (that.isSubTask) {
            if (values[i].subtask !== undefined) {
              if (values[i].subtask) {
                issueTypes.push('(' + values[i].id + ') ' + values[i].name);
              }
            } else {
              issueTypes.push('(' + values[i].id + ') ' + values[i].name);
            }
          } else {
            if (!values[i].subtask) {
              issueTypes.push('(' + values[i].id + ') ' + values[i].name);
            }
          }
        }

        console.log(issueTypes.join('\n'));
      }

      program.prompt(question, function (answer) {
        if (answer.length > 0) {
          callback(answer);
        } else {
          if (yesno) {
            callback(false);
          } else {
            that.ask(question, callback);
          }
        }
      }, options);
    },
    askProject: function (project, callback) {
      var that = this,
          i = 0;
      this.ask('Type the project name or key: ', function (answer) {
        var projectId = 0,
            index = 0;
        answer = answer.charAt(0).toUpperCase() + answer.substring(1).toLowerCase();

        for (i; i < that.projects.length; i++) {
          if (answer == that.projects[i].key || answer.toUpperCase() == that.projects[i].key) {
            projectId = that.projects[i].id;
            index = i;
          } else if (answer == that.projects[i].name) {
            projectId = that.projects[i].id;
            index = i;
          }
        }

        if (projectId > 0) {
          callback(projectId, index);
        } else {
          console.log('Project "' + answer + '" does not exists.');
          that.askProject(project, callback);
        }
      }, null, null, project);
    },
    askSubTask: function (subtask, callback) {
      var that = this;
      that.ask('Type the parent task key (only the numbers) if exists, otherwise press enter: ', function (answer) {
        if (answer === false || parseInt(answer) > 0) {
          that.isSubTask = answer ? true : false;
          callback(answer);
        } else {
          console.log('Please, type only the task number (ex: if issue is "XXX-324", type only "324").');
          that.askSubTask(subtask, callback);
        }
      }, true, null, subtask);
    },
    askIssueType: function (type, callback) {
      var that = this,
          issueTypeArray = that.project.issuetypes;
      that.ask('Select issue type: ', function (issueType) {
        callback(issueType);
      }, false, issueTypeArray, type);
    },
    askIssuePriorities: function (priority, callback) {
      var that = this,
          issuePriorities = that.priorities;
      that.ask('Select the priority: ', function (issuePriority) {
        callback(issuePriority);
      }, false, issuePriorities, priority);
    },
    newIssue: function (projIssue, options) {
      var that = this;
      var project = typeof projIssue === 'string' ? projIssue : undefined;
      var parent = undefined;

      if (project !== undefined) {
        var split = project.split('-');
        project = split[0];

        if (split.length > 1) {
          parent = split[1];
          console.log('Creating subtask for issue ' + projIssue);
        } else {
          console.log('Creating issue in project ' + project);
        }
      }
      this.getMeta(function (error, meta) {
        if (error) {
          printError(error.messages);
          process.stdin.destroy();
          return;
        }
        that.projects = meta;
        that.askProject(options.project, function (projectId, index) {
          that.project = that.projects[index];
          that.answers.fields.project = {
            id: projectId
          };

          if (!options.subtask && (options.priority || options.type || options.summary || options.description)) {
            options.subtask = false;
          }

          that.askSubTask(options.subtask, function (taskKey) {
            if (taskKey) {
              that.answers.fields.parent = {
                key: that.project.key + '-' + taskKey
              };
            }

            that.askIssueType(options.type, function (issueTypeId) {
              that.answers.fields.issuetype = {
                id: issueTypeId
              };
              that.ask('Type the issue summary: ', function (issueSummary) {
                that.answers.fields.summary = issueSummary;
                that.ask('Type the issue description: ', function (issueDescription) {
                  var defaultAnswer = issueSummary;

                  if (!issueDescription) {
                    that.answer.fields.description = defaultAnswer;
                  } else {
                    that.answers.fields.description = issueDescription;
                  }

                  process.stdin.destroy();
                  that.saveIssue(options);
                }, null, null, options.description);
              }, null, null, options.summary);
            });
          });
        });
      });
    },
    getMeta: function (callback) {
      jira.issue.getCreateMetadata({})
        .then(data => {
          callback(undefined, data.projects);
        }, response => {
          callback({ messages: utils. extractErrorMessages(response) }, undefined);
        });
    },

    saveIssue: function () {
      jira.issue.createIssue(this.answers)
        .then(data => {
          console.log(`Issue ${data.key} created successfully!`)
        }, response => {
          const errorMessages = utils.extractErrorMessages(response)
          printError(errorMessages);
        });
    }
  };
  return create;
};
