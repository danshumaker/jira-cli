module.exports = function () {
  const promptly = require('promptly');

  var sslRequest = require('../../lib/ssl_request');

  var config = require('../../lib/config');

  var answers;
  function ask(question, callback, yesno, values, options) {
    var that = this,
      issueTypes = [],
      i = 0; //from command if provided

    if (values && values.length > 0) {
      for (i; i < values.length; i++) {
        if (that.isSubTask) {
          if (values[i].subtask !== undefined) {
            if (values[i].subtask) {
              issueTypes.push('(' + values[i].id + ') ' + options.from + ' ' + values[i].outward + ' ' + options.to);
            }
          } else {
            issueTypes.push('(' + values[i].id + ') ' + options.from + ' ' + values[i].outward + ' ' + options.to);
          }
        } else {
          if (!values[i].subtask) {
            issueTypes.push('(' + values[i].id + ') ' + options.from + ' ' + values[i].outward + ' ' + options.to);
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
      })
      .catch(e => {
        if(e && e.message === 'canceled') {
          console.log('\nInput cancelled');
        } else {
          console.log('\nError: ' + e.toString());
        }
      });
  }

  function askLinkType(options, cb) {
    getLinkType(function (linkTypes) {
      ask(
        'Select the linktype: ',
        function (link) {
          if(link) {
            cb(link);
          }
        },
        false,
        linkTypes,
        options);
    });
  }

  function getLinkType(cb) {
    this.query = 'rest/api/2/issueLinkType';
    sslRequest
      .get(config.auth.url + this.query)
      .end((err, res) => {
        try {
          if (!res.ok) {
            return console.log(res.body.errorMessages.join('\n'));
          }
        } catch(e) {
          return cb(e);
        }

        return cb(res.body.issueLinkTypes);
      });
  }

  function callLink(reqOpts, cb) {
    this.query = 'rest/api/2/issueLink';
    sslRequest
      .post(config.auth.url + this.query)
      .send(JSON.stringify(reqOpts))
      .end((err, res) => {
        try {
          if (!res.ok) {
            return console.log(res.body.errorMessages.join('\n'));
          }
        } catch(e) {
          return cb(e);
        }
        console.log('Issues linked');
        return cb();
      });
  }

  return function link(from, to, link_value, options, cb) {
    var reqOpts = {
      'type': {
        'name': 'Relate'
      },
      'inwardIssue': {
        'key': from
      },
      'outwardIssue': {
        'key': to
      },
      'comment': {
        'body': 'Linked related issue!'
      }
    };
    options.from = from;
    options.to = to;
    options.link_value = link_value;
    if(!options.link_value) {
      askLinkType(options, function (linkname) {
        reqOpts.type.id = linkname;
        callLink(reqOpts, cb);
      });
    } else {
      reqOpts.type.id = options.link_value;
      callLink(reqOpts, cb);
    }
  };
}();
