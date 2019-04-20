/*global requirejs,console,define,fs*/
define([
        'superagent',
        '../../lib/config',
], function ( request, config ) {

    var report = {
        query: null,
        table: null,

        send: function (options) {
            var request = require("request");

            var request_options = { method: 'POST',
                url: config.auth.url + 'secure/ReleaseNote.jspa',
                qs: { projectId: options.projectId, version: options.version },
                headers:
                { Authorization: 'Basic ' + config.auth.token, 'Content-Type': 'application/json' } };

            request(request_options, function (error, response, body) {
                if (error) throw new Error(error);

                cheerio = require("cheerio");
                var $ = cheerio.load(body);

                editcopy = $('textarea#editcopy').text();
                console.log($('textarea#editcopy').text());

                console.log('HIT Control-C to break the stdin lock - NOTE your email is already sent.');

                var Gmailer = require("gmail-sender");
                Gmailer.options({
                    smtp: {
                        service: "Gmail",
                        user: config.auth.user + '@phase2technology.com',
                        pass: options.password
                    }
                });
                Gmailer.send({
                    subject: options.subject,
                    template: options.template,
                    from: options.from,
                    to: {
                        email: options.to,
                        name: options.to,
                        surname: options.to
                    },
                    data: {
                        release_version: options.name,
                        link: config.auth.url + 'projects/' + options.project_prefix + '/versions/' + options.version,
                        report: editcopy
                    },
                });
                process.stdin.destroy();
                process.stdout.destroy();
            });
        },
    };

    return report;

});
