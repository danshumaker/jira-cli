/*global requirejs,console,define,fs*/
define([
        'superagent',
        '../../lib/config'
], function (request, config) {

    var fix = {
        query: null,

        to: function (ticket, version) {
            this.query = 'rest/api/2/issue/' + ticket;

            request
                .put(config.auth.url + this.query)
                .send( { "update": { "fixVersions" : [ {"set": [ {"name" : version } ] } ] } } )
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + config.auth.token)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }

                    return console.log('FixVersion [' + ticket + '] set to ' + version + '.');

                });
        },
        append: function (ticket, version ) {
            this.query = 'rest/api/2/issue/' + ticket;

            request
                .put(config.auth.url + this.query)
                .send({ "update": { "fixVersions" : [ {"add": {"name" : version }  } ] } }) 
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Basic ' + config.auth.token)
                .end(function (res) {
                    if (!res.ok) {
                        return console.log((res.body.errorMessages || [res.error]).join('\n'));
                    }

                    return console.log('Appended FixVersion ' + version + ' to [' + ticket + '].');

                });
        },
    };

    return fix;

});
