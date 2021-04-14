/*global, console*/
module.exports = function () {
  const promptly = require('promptly');

  var sslRequest = require('../../lib/ssl_request');

  var config = require('../../lib/config');

  var async = require('async');

  const utils = require('../utils');

  var create = {
    query: null,
    table: null,
    isSubTask: false,
    projects: [],
    projectMeta: {},
    priorities: [],
    answers: {
      fields: {}
    },
    ask: function (question, callback, yesno, values, answer) {
      var that = this,
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
                issueTypes.push('(' + values[i].id + ') ' + (values[i].name ? values[i].name : values[i].value));
              }
            } else {
              issueTypes.push('(' + values[i].id + ') ' + (values[i].name ? values[i].name : values[i].value));
            }
          } else {
            if (!values[i].subtask) {
              issueTypes.push('(' + values[i].id + ') ' + (values[i].name ? values[i].name : values[i].value));
            }
          }
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
        });
    },
    askProject: function (project, callback) {
      var that = this,
        i = 0;
      this.ask('Type the project name or key: ', function (answer) {
        var projectId = 0,
          index = 0;
        answer = answer.charAt(0).toUpperCase() + answer.substring(1).toLowerCase();

        for (i; i < that.projects.length; i++) {
          if (answer === that.projects[i].key || answer.toUpperCase() === that.projects[i].key) {
            projectId = that.projects[i].id;
            index = i;
          } else if (answer === that.projects[i].name) {
            projectId = that.projects[i].id;
            index = i;
          }
        }

        if (projectId > 0) {
          callback(projectId, index, answer.toUpperCase());
        } else {
          console.log('Project "' + answer + '" does not exists.');
          that.askProject(project, callback);
        }
      }, false, null, project);
    },
    getMeta: function (key, callback) {
      this.query = 'rest/api/2/issue/createmeta';

      if (key) {
        this.query += '?projectKeys=' + key + '&expand=projects.issuetypes.fields';
      }

      sslRequest
        .get(config.auth.url + this.query)
        .end((err, res) => {
          if (!res.ok) {
            const errorMessages = utils.extractErrorMessages(res).join('\n');
            console.log(errorMessages);
            return callback(errorMessages);
          }

          callback(null, res.body.projects);
      });
    },
    askIssueType: function (type, callback) {
      var that = this,
        issueTypeArray = create.projectMeta.issuetypes;
      that.ask('Select issue type: ', function (issueType) {
        callback(issueType);
      }, false, issueTypeArray, type);
    },
    askRequired: function (eachField, eachFieldKey, defaultAnswer, scb) {
      var that = this;

      if (!eachField.required && !(config.default_create && config.default_create['__always_ask'] && config.default_create['__always_ask'].fields && config.default_create['__always_ask'].fields[eachFieldKey])) {
        return scb();
      }

      var question = (eachField.allowedValues ? 'Select ' : 'Enter ') + eachField.name + ' : ';
      that.ask(question, function (answer) {
        if (answer) {
          //supplying answer by field type
          if (eachField.schema.type === 'array') {
            if (eachField.schema.items !== 'string') {
              create.answers.fields[eachFieldKey] = [{
                id: answer
              }];
            } else {
              answer = answer.split(',');
              create.answers.fields[eachFieldKey] = answer;
            }
          } else if (eachField.schema.type === 'string') {
            create.answers.fields[eachFieldKey] = answer;
          } else {
            create.answers.fields[eachFieldKey] = {
              id: answer
            };
          }

          return scb();
        } else {
          return create.askRequired(eachField, eachFieldKey, defaultAnswer, scb);
        }
      }, false, eachField.allowedValues, defaultAnswer);
    },
    saveIssue: function (options, cb) {
      this.query = 'rest/api/2/issue';
      const post_url = config.auth.url + this.query; //create.answers.fields.reporter['name'] = create.answers.fields.reporter['id'];

      if (create.answers.fields.reporter && 
        !create.answers.fields.reporter['name'] &&
        create.answers.fields.reporter['id']) {
        create.answers.fields.reporter['name'] = create.answers.fields.reporter['id'];
      }
      const body = JSON.stringify(create.answers);

      if (options.verbose) {
        console.log(create.answers);
        console.log(post_url);
        console.log(body);
      }

      sslRequest.post(post_url)
        .send(body)
        .end((err, res) => {
          if (!res.ok) {
            if (options.verbose) {
              console.log(res);
            }
            const errorMessages = utils.extractErrorMessages(res).join('\n');
            return cb(errorMessages)
          }

          if (options.verbose) {
            console.log(res);
          }

          console.log('Issue ' + res.body.key + ' created successfully!');
          console.log('Open ' + utils.url.resolve(config.auth.url, 'browse/' + res.body.key));
          return cb();
        });
    },
    create: function (options, cb) {
      // check if input config key given eg. payoutmdo
      // if given then set the default values from config.json for payoutmdo
      // prompt the input for other required:true fields
      //
      var that = this;
      async.waterfall([// get project
        function (wcb) {
          create.getMeta(null, function (err, meta) {
            if (err) {
              return wcb(err);
            }

            create.projects = meta;
            return wcb(null, options);
          });
        }, function (options, wcb) {
          // verify the project
          if (options.key && config.default_create && config.default_create[options.key] && config.default_create[options.key].project) {
            if (!options.project && config.default_create[options.key].project) {
              options.project = config.default_create[options.key].project;
            }
          }

          create.askProject(options.project, function (projectId, index, projectKey) {
            options.projectId = projectId;
            options.projectIndex = index;
            options.project = projectKey;
            create.answers.fields.project = {
              id: projectId
            };
            return wcb(null, options);
          });
        }, function (options, wcb) {
          create.getMeta(options.project, function (err, meta) {
            // call meta for this project https://jira.mypaytm.com/rest/api/2/issue/createmeta?projectKeys=MDO&expand=projects.issuetypes.fields&
            if (err) {
              return wcb(err);
            }

            meta.forEach(function (eachProjectMeta) {
              if (eachProjectMeta.id == options.projectId) {
                create.projectMeta = eachProjectMeta;
              }
            });

            if (!create.projectMeta) {
              return wcb('project meta not found');
            }

            return wcb(null, options);
          });
        }, function (options, wcb) {
          // parse command line fields if they where passed in
          if(options.field) {
            if(options.verbose) {
              console.log(options.field);
            }

            create.answers.fields = {...create.answers.fields, ...options.field};
          }

          return wcb(null, options)
        }, function (options, wcb) {
          //using default from config
          // get issueType
          if (options.key && config.default_create && config.default_create[options.key] && config.default_create[options.key].issueType) {
            if (!options.type && config.default_create[options.key].issueType) {
              options.type = config.default_create[options.key].issueType;
            }
          }

          create.askIssueType(options.type, function (issueType) {
            create.answers.fields.issuetype = {
              id: issueType
            };
            options.type = issueType;
            create.projectMeta.issuetypes.forEach(function (eachIssueType) {
              if (eachIssueType.id == issueType) {
                create.issueType = eachIssueType;
              }
            });

            if (!create.issueType) {
              return wcb(new Error('invalid issue type'));
            }

            return wcb(null, options);
          });
        }, function (options, wcb) {
          //ask for required fields
          // get required:true fields from meta
          if(options.verbose) {
            console.log(options);
          }

          async.eachSeries(Object.keys(create.issueType.fields), function (eachFieldKey, scb) {
            var eachField = create.issueType.fields[eachFieldKey]; //if only 1 allowed value then take it as answer  and dont prompt the user

            var defaultAnswer;

            if (eachField.allowedValues && eachField.allowedValues.length == 1) {
              defaultAnswer = eachField.allowedValues[0].id;
              return scb();
            } //picking field config from config

            if (options.verbose) {
              console.log({
                eachField: eachField
              });
              console.log({
                eachFieldKey: eachFieldKey
              });
            }

            if (options.key && config.default_create && config.default_create[options.key] && config.default_create[options.key].default) {
              if (config.default_create[options.key].default[eachFieldKey]) {
                create.answers.fields[eachFieldKey] = config.default_create[options.key].default[eachFieldKey];
                return scb();
              }
            }

            if (options[eachFieldKey]) {
              if (!create.answers.fields[eachFieldKey]) {
                // only set answer if it hasn't been set already
                create.answers.fields[eachFieldKey] = options[eachFieldKey];
              }
              return scb();
            }

            return create.askRequired(eachField, eachFieldKey, defaultAnswer, scb);
          }, function () {
            return wcb(null, options);
          });
        }, function (options, wcb) {
          create.saveIssue(options, wcb);
        }], function (err) {
        return cb(err);
      });
    }
  };
  return create;
}();
