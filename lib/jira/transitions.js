/*global requirejs,console,define,fs*/
module.exports = function () {
  var sslRequest = require('../../lib/ssl_request');;

  var Table = require('cli-table');

  var config = require('../../lib/config');

  const promptly = require('promptly');

  var transitions = {
    query: null,
    transitions: null,
    transitionID: null,
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

      valueArray = values.map(function (value) {
        return value.id;
      });
      promptly
        .prompt(question)
        .then(answer => {
          if (answer.length > 0) {
            if (valueArray.indexOf(answer) >= 0) {
              callback(answer);
            } else {
              that.ask(question, callback, yesno, values);
            }
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
    },
    doTransition: function (issue, transitionID, resolutionID, cb) {
      var that = this;

      if (typeof resolutionID === 'function') {
        cb = resolutionID;
        resolutionID = null;
      }

      this.query = 'rest/api/2/issue/' + issue + '/transitions';
      var requestBody = {
        transition: {
          id: transitionID
        }
      };

      if (resolutionID && config.options['jira_done']['check_resolution']) {
        requestBody.fields = {
          resolution: {
            id: resolutionID
          }
        };
      }

      sslRequest.post(config.auth.url + this.query).send(requestBody).end((err, res) => {
        try {
          if (!res.ok) {
            cb((res.body.errorMessages || [res.error]).join('\n'));
          }
        } catch(e) {
          if (err && err.message) {
            return cb(`A connection error occurred: Error Number: ${err.errno} | Message: ${err.message}`)
          }
          return cb(e);
        }

        if (cb) {
          cb();
        }
      });
    },
    getTransitions: function (issue, cb) {
      this.query = 'rest/api/2/issue/' + issue + '/transitions';
      sslRequest.get(config.auth.url + this.query).end((err, res) => {
        try {
          if (!res.ok) {
            debugger;
            return cb(new Error(res.body.errorMessages.join('\n')));
          }
        } catch(e) {
          if (err && err.message) {
            return cb(`A connection error occurred: Error Number: ${err.errno} | Message: ${err.message}`)
          }
          return cb(e);
        }

        var transitions = res.body.transitions || [];
        return cb(null, transitions);
      });
    },
    makeTransition: function (issue, cb) {
      transitions.getTransitions(issue, function (err, transitionsAvailable) {
        if (err) {
          return cb(err);
        }

        transitions.ask('Enter transition ', function (answer) {
          transitions.doTransition(issue, answer, function (err) {
            if (err) {
              return cb(err);
            }

            console.log('marked issue with transition ' + answer);
            return cb();
          });
        }, null, transitionsAvailable);
      });
    },
    getTransitionCode: function (issue, transitionName, cb) {
      var that = this,
        i = 0;
      transitions.getTransitions(issue, function (err, allTransitions) {
        if (err) {
          return cb(err);
        }

        allTransitions.some(function (transition) {
          if (transition.name === transitionName) {
            that.transitionID = transition.id;
          } else if (transition.to.name === transitionName) {
            that.transitionID = transition.id;
          }
        });

        if (!that.transitionID) {
          console.log('Issue already ' + transitionName + ' or bad transition.');

          if (allTransitions) {
            console.log('Available Transitions');
            var table = new Table({
              head: ['Key', 'Name']
            });
            allTransitions.forEach(function (item) {
              table.push([item.id, item.name]);
            });
            console.log(table.toString());
          }

          return;
        } else {
          cb(that.transitionID);
        }
      });
    },
    getResolutionCode: function (resolutionName, callback) {
      var that = this,
        i = 0;
      this.query = 'rest/api/2/resolution';
      sslRequest.get(config.auth.url + this.query).end((err, res) => {
        try {
          if (!res.ok) {
            return console.log(res.body.errorMessages.join('\n'));
          }
        } catch(e) {
          if (err && err.message) {
            return callback(`A connection error occurred: Error Number: ${err.errno} | Message: ${err.message}`)
          }
          return callback(e);
        }

        var resolutions = res.body,
          resolutionData; // when a specific resolution is informed by command line.

        if (resolutionName && resolutionName !== '') {
          resolutions.forEach(function (resolution) {
            if (resolution.name == resolutionName) {
              resolutionData = resolution;
            }
          });
        } // default is always first
        else if (!resolutionName && resolutions.length > 0) {
          resolutionData = resolutions[0];
        }

        if (resolutionData) {
          return callback(resolutionData.id);
        } else {
          console.log('Resolution Not Found!\n');
          console.log('Available Resolutions');
          var table = new Table({
            head: ['Key', 'Name', 'Description']
          });
          resolutions.forEach(function (item) {
            table.push([item.id, item.name, item.description]);
          });
          console.log(table.toString());
          console.log('You can change that behaviour by editing ~/.jira/config.json');
          return;
        }
      });
    },
    start: function (issue, cb) {
      var that = this;
      this.transitionName = config.options['jira_start']['status'];
      this.getTransitionCode(issue, that.transitionName, function (transitionID) {
        that.doTransition(issue, transitionID, function (err) {
          console.log('Issue [' + issue + '] moved to ' + that.transitionName);
          cb(err);
        });
      });
    },
    stop: function (issue, cb) {
      var that = this;
      this.transitionName = config.options['jira_stop']['status'];
      this.getTransitionCode(issue, that.transitionName, function (transitionID) {
        that.doTransition(issue, transitionID, function (err) {
          console.log('Issue [' + issue + '] moved to ' + that.transitionName);
          cb(err);
        });
      });
    },
    review: function (issue, cb) {
      var that = this;
      this.transitionName = config.options['jira_review']['status'];
      this.getTransitionCode(issue, that.transitionName, function (transitionID) {
        that.doTransition(issue, transitionID, function (err) {
          console.log('Issue [' + issue + '] moved to ' + that.transitionName);
          cb(err);
        });
      });
    },
    done: function (issue, resolution, cb) {
      var that = this;
      this.transitionName = config.options['jira_done']['status'];
      this.resolutionName = resolution;
      this.getResolutionCode(this.resolutionName, function (resolutionID) {
        that.getTransitionCode(issue, that.transitionName, function (transitionID) {
          that.doTransition(issue, transitionID, resolutionID, function (err) {
            console.log('Issue [' + issue + '] moved to ' + that.transitionName);
            cb(err);
          });
        });
      });
    },
    invalid: function (issue, resolution, cb) {
      var that = this;
      this.transitionName = config.options['jira_invalid']['status'];
      this.resolutionName = resolution;
      this.getResolutionCode(this.resolutionName, function (resolutionID) {
        that.getTransitionCode(issue, that.transitionName, function (transitionID) {
          that.doTransition(issue, transitionID, resolutionID, function (err) {
            console.log('Issue [' + issue + '] moved to ' + that.transitionName);
            cb(err);
          });
        });
      });
    }
  };
  return transitions;
}();
