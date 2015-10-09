'use strict';
var api = require('./shared.js');
var fs = require('fs');
var rest = require('restler');

module.exports = {
    topic: 'connect',
    command: 'import',
    description: 'Import configuration from an export file',
    help: 'Imports the mapping configuration from a json export file',
    flags: [
      {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true},
      {name: 'file', char: 'f', desciption: 'Json export file name', hasValue:true}
    ],
    needsApp: true,
    needsAuth: true,
    run: function (context) {
      if (!context.flags.file) {
        console.log("You must support the file name of an export file");
        return;
      }
      api.withUserConnections(context.auth.password, context.app, context.flags).then(function(connections){
          if (connections.length > 1) {
            console.log("Multiple connections found. Please use '-r' to specify a single connection by resource name.");
          } else {
            let connection = connections[0];
            let url = 'https://' + api.HOST + ':443' + '/api/v3/connections/' + connection.id + '/actions/import';
            fs.stat(context.flags.file, function(err, stats) {
              rest.post(url, {
                headers: {
                  Authorization: 'Bearer ' + context.auth.password
                },
                multipart: true,
                data: {
                  'config': rest.file(context.flags.file, null, stats.size, null, context.flags.file)
                }
              }).on('complete', function(data) {
                console.log("Upload complete");
                console.log(data);
              });
            });
          }
      });
    }
};
