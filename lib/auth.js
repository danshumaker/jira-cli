module.exports = (function() {
  var program = require('commander');

  var fs = require('fs');

  var config = require('./config');

  const auth = {
    answers: {},
    ask: function(question, callback, password) {
      var that = this;

      if (password) {
        program.password(question, function(answer) {
          if (answer.length > 0) {
            callback(answer);
          } else {
            that.ask(question, callback, true);
          }
        });
      } else {
        program.prompt(question, function(answer) {
          if (answer.length > 0) {
            callback(answer);
          } else {
            that.ask(question, callback);
          }
        });
      }
    },
    setup: function(options) {
      var that = this; // Does your config file exist

      if (!config.isLoaded()) {
        // If not then create it
        this.ask('Jira URL: ', function(answer) {
          that.answers.url = answer;
          that.ask('Username: ', function(answer) {
            that.answers.user = answer;
            that.ask(
              'Password: ',
              function(answer) {
                that.answers.pass = answer;
                process.stdin.destroy();
                that.saveConfig(options);
              },
              true
            );
          });
        });
      }
    },
    clearConfig: function() {
      program.confirm('Are you sure? ', function(answer) {
        if (answer) {
          config.clear();
          console.log('Configuration deleted successfully!');
        }

        process.stdin.destroy();
      });
    },
    saveConfig: function(options) {
      if (this.answers.url) {
        if (!/\/$/.test(this.answers.url)) {
          this.answers.url += '/';
        }
      }

      if (this.answers.user && this.answers.pass) {
        this.answers.token = this.answers.user + ':' + this.answers.pass;
        const auth = {
          url: this.answers.url,
          user: this.answers.user,
          token: Buffer.from(this.answers.token).toString('base64')
        };
        delete this.answers.pass;

        if (options.verbose) {
          console.log(options);
        }

        if (options.template && fs.existsSync(options.template)) {
          console.log('Using cli supplied default config file');
          config.loadInitialFromTemplate(options.template);
        }

        config.update('auth', auth);
        config.save();
        console.log('Information stored!');
      }
    }
  };
  return auth;
})();
