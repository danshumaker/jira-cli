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
      _ = require("underscore");
      var fs = require("fs");

      var request_options = { method: 'POST',
        url: config.auth.url + 'secure/ReleaseNote.jspa',
        qs: { projectId: options.projectId, version: options.version },
        headers:
        { Authorization: 'Basic ' + config.auth.token, 'Content-Type': 'application/json' }
      };

      request(request_options, function (error, response, body) {
        if (error) throw new Error(error);

        cheerio = require("cheerio");
        var $ = cheerio.load(body);

        editcopy = $('textarea#editcopy').text();


        const nodemailer = require('nodemailer');
        let transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: config.auth.user,
            pass: options.password
          }
        });

        templateContent = fs.readFileSync(options.template, encoding = "utf8");
        var data = {
          release_version: options.name,
          link: config.auth.url + 'projects/' + options.project_prefix + '/versions/' + options.version,
          report: editcopy
        };
        _.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };
        getHTML = _.template(templateContent);
        html_body = getHTML(data);
        async function send_it() {
          let info = await transporter.sendMail({
            from: config.auth.user,
            to: options.to,
            cc: options.cc,
            subject: options.subject,
            html: html_body
          });

          console.log('Message sent: %s', info.messageId);
        }
        send_it();

    });
  },
};

return report;

});
