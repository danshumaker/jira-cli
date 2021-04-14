module.exports = function () {
  const promptly = require('promptly');

  var sslRequest = require('../../lib/ssl_request');

  var config = require('../../lib/config');

  function ask(question, callback, yesno, values) {
    var that = this,
      issueTypes = [],
      i = 0; //from command if provided

    if (options.link_value) {
      return callback(options.link_value);
    }

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
      });
  }

  function askLinkType(options, cb) {
    getLinkType(function (linkTypes) {
      ask('Select the linktype: ', function (link) {
        cb(link);
      }, false, linkTypes);
    });
  }

  function getLinkType(cb) {
    this.query = 'rest/api/2/issueLinkType';
    sslRequest.get(config.auth.url + this.query).end((err, res) => {
      if (!res.ok) {
        return console.log(res.body.errorMessages.join('\n'));
      }

      return console.log(res.body.issueLinkTypes);
    });
  }

  function callLink(reqOpts, cb) {
    this.query = 'rest/api/2/issueLink';
    sslRequest.post(config.auth.url + this.query).send(reqOpts).end((err, res) => {
      if (!res.ok) {
        return console.log(res.body.errorMessages.join('\n'));
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
    askLinkType(options, function (linkname) {
      reqOpts.type.id = linkname;
      callLink(reqOpts, cb);
    });
  };
}();
