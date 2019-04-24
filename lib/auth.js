/*global requirejs,define,fs*/
define([
    'commander',
    'fs',
    'path',
    './config',
    './default_config'
], function(program, fs, path, config, defaultConfig) {
    var Auth = {
        fullPath: process.cwd() + '/.jira-cmd/config.json',
        answers: {},

        loadConfig: function() {
            if (fs.existsSync(this.fullPath)) {
                configObject = JSON.parse(fs.readFileSync(this.fullPath, 'utf-8'));

                config.auth = configObject.auth;
                config.options = configObject.options;
                config.custom_jql = configObject.custom_jql;
                config.custom_alasql = configObject.custom_alasql;
                config.user_alias = configObject.user_alias;
                config.edit_meta = configObject.edit_meta;
                config.default_create = configObject.default_create;
                if (!config.options || !config.options["jira_stop"]) {
                    console.log('Ops! Seems like your ' + this.fullPath + ' is out of date. Please reset you configuration.');
                    return false;
                } else {
                    return true;
                }

            } else {
                return false;
            }
        },

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
            var that = this;
            // Does your config file exist
            if (!this.loadConfig()) {
                // If not then create it
                this.ask('Jira URL: ', function(answer) {
                    that.answers.url = answer;

                    that.ask('Username: ', function(answer) {
                        that.answers.user = answer;

                        that.ask('Password: ', function(answer) {
                            that.answers.pass = answer;
                            process.stdin.destroy();
                            that.saveConfig(options);
                        }, true);
                    });
                });
            }
        },

        clearConfig: function() {
            var that = this;

            if (!fs.existsSync(this.fullPath)) {
                if (fs.existsSync(path.basename(this.fullPath))) {
                    fs.rmdirSync(path.basename(this.fullPath));
                }
                console.log('There is no stored data. Skipping.');
            } else {
                program.confirm('Are you sure? ', function(answer) {
                    if (answer) {
                        fs.unlinkSync(that.fullPath);
                        if (fs.existsSync(path.basename(that.fullPath))) {
                            fs.rmdirSync(path.basename(that.fullPath));
                        }
                        console.log('Configuration deleted successfully!');
                    }
                    process.stdin.destroy();
                });
            }
        },

        saveConfig: function(options) {
            var configFile = {},
                auth;

            if (this.answers.url) {
                if (!/\/$/.test(this.answers.url)) {
                    this.answers.url += '/';
                }
            }

            if (this.answers.user && this.answers.pass) {
                this.answers.token = this.answers.user + ':' + this.answers.pass;

                auth = {
                    url: this.answers.url,
                    user: this.answers.user,
                    token: Buffer.from(this.answers.token).toString('base64')
                };

                delete this.answers.pass;
            }

            if (options.verbose) {
                console.log(options);
            }

            if (options.template && (fs.existsSync(options.template))) {
                console.log("Using cli supplied default config file");
                defaultConfig = JSON.parse(fs.readFileSync(options.template, 'utf-8'));
            }

            configFile = defaultConfig;
            configFile.auth = auth;
            console.log(this.fullPath);
            fs.writeFileSync(this.fullPath, JSON.stringify(configFile, null, 2));
            console.log('Information stored!');
        }
    };

    return Auth;

});
