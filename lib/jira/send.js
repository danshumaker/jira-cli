/*global requirejs,console,define,fs*/
module.exports = function () {
  var sslRequest = require('../../lib/ssl_request');;

  var config = require('../../lib/config');

  var report = {
    query: null,
    table: null,
    send: function (options) {

      _ = require("underscore");

      var fs = require("fs");
      sslRequest.post(config.auth.url + 'secure/ReleaseNote.jspa')
      .query({ projectId: options.projectId })
      .query({ version: options.version })
      .end((error, response) => {
        if (error) throw new Error(error);
        cheerio = require("cheerio");
        var $ = cheerio.load(response.body);
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
        _.templateSettings = {
          interpolate: /\{\{(.+?)\}\}/g
        };
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
    }
  };
  return report;
}();