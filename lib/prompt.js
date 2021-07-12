/*global requirejs,console,define,fs*/
module.exports = function () {
  var readline = require('readline');

  var sslRequest = require('../../lib/ssl_request');;

  var config = require('./config');

  var getUserCompletions = function getUserCompletions(line, word, options, cb) {
    var userOptions = options && options.user ? options.user : {},
      enabled = userOptions.enabled !== undefined ? userOptions.enabled : false,
      forMention = userOptions ? userOptions.forMention : false,
      isUserComplete = word && forMention ? word.indexOf('[~') === 0 : true,
      queryWord = forMention && isUserComplete ? word.slice(2) : word;

    if (!enabled || !isUserComplete || !queryWord) {
      return cb([]);
    }

    result = !queryWord ? null : sslRequest.get(config.auth.url + 'rest/api/2/user/search?username=' + queryWord).end((err, res) => {
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

      var hits = res.body.filter(function (user) {
        return user.name.indexOf(queryWord) == 0;
      });
      hits = hits.map(function (user) {
        return user.name;
      });
      var exact = hits.filter(function (user) {
        return user == queryWord;
      });
      hits = exact.length === 1 ? exact : hits;

      if (forMention) {
        hits = hits.map(function (user) {
          return '[~' + user + ']';
        });
      }

      cb(hits, word);
    });
  };

  var getCompletions = function getCompletions(line, word, options, cb) {
    getUserCompletions(line, word, options, function userCompletionHits(userHits, line) {
      cb(null, [userHits, line]);
    });
  };

  var getCompleter = function getCompleter(options) {
    var completer = function completer(line, cb) {
      var words = line ? line.split(/\s+/) : [],
        word = words.length > 0 ? words[words.length - 1] : '';

      if (!word) {
        cb([[], line]);
      }

      getCompletions(line, word, options, cb);
    };

    return completer;
  };

  return function (question, cb, options) {
    var options = options || options,
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        completer: getCompleter(options)
      });
    rl.question(question, function (answer) {
      rl.close();
      cb(answer);
    });
  };
}();
