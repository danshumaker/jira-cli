module.exports = function () {
  const promptly = require('promptly');

  var commonUtils = {
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
        })
        .catch(e => {
          if(e && e.message === 'canceled') {
            console.log('\nInput cancelled');
          } else {
            console.log('\nError: ' + e.toString());
          }
        });
    }
  };
  return commonUtils;
}();
