/*global requirejs,define,fs*/
define([
    'commander',
    'fs',
    './config',
    './default_config'
], function (program, fs, config, defaultConfig) {
    var Auth = {
        cfgPath: config.cfgPath || process.cwd() + '/.jira-cwd',
        fullPath: config.cfgFilePath || process.cwd() + '/.jira-cwd/config.json',
        answers: {},

        checkConfig: function () {
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

        ask: function (question, callback, password) {
            var that = this;

            if (password) {
                program.password(question, function (answer) {
                    if (answer.length > 0) {
                        callback(answer);
                    } else {
                        that.ask(question, callback, true);
                    }
                });
            } else {
                program.prompt(question, function (answer) {
                    if (answer.length > 0) {
                        callback(answer);
                    } else {
                        that.ask(question, callback);
                    }
                });
            }
        },

        setConfig: function (options) {
            var that = this;
            // Does your config file exist
            if (this.checkConfig()) {
                // If it does then update it
                this.updateConfig(options);
            } else {
                // If not then create it

                //console.log("setConfig options=");
                //console.log(options);
                this.ask('Jira URL: ', function (answer) {
                    that.answers.url = answer;

                    that.ask('Username: ', function (answer) {
                        that.answers.user = answer;

                        that.ask('Password: ', function (answer) {
                            that.answers.pass = answer;
                            process.stdin.destroy();
                            that.saveConfig(options);
                        }, true);
                    });
                });
            }
        },

        updateConfig: function (options) {

            //console.log("in updateConfig");
            if (options.template && (fs.existsSync(options.template))) {
              defaultConfig = JSON.parse(fs.readFileSync(options.template, 'utf-8'));
            }
            Object.keys(defaultConfig).forEach(function (eachKey) {
                if (!config[eachKey]) {
                    config[eachKey] = defaultConfig[eachKey];
                }
            });
            fs.writeFileSync(this.fullPath, JSON.stringify(config, null, 2));
        },

        clearConfig: function () {
            var that = this;

            if (!fs.existsSync(this.fullPath)) {
                if (fs.existsSync(this.cfgPath)) {
                    fs.rmdirSync(this.cfgPath);
                }
                console.log('There is no stored data. Skipping.');
            } else {
                program.confirm('Are you sure? ', function (answer) {
                    if (answer) {
                        fs.unlinkSync(that.fullPath);
                        if (fs.existsSync(this.cfgPath)) {
                          fs.rmdirSync(that.cfgPath);
                        }
                        console.log('Configuration deleted successfully!');
                    }
                    process.stdin.destroy();
                });
            }
        },

        saveConfig: function (options) {
            var configFile = {},
                auth;

            //console.log("options =" ,options);
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
            fs.writeFileSync(this.fullPath, JSON.stringify(configFile, null, 2));
            console.log('Information stored!');
        }
    };

    return Auth;

});
