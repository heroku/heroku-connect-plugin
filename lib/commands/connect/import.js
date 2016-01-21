'use strict';
var api = require('./shared.js');
var fs = require('fs');

module.exports = {
    topic: 'connect',
    command: 'import',
    description: 'Import configuration from an export file',
    help: 'Imports the mapping configuration from a json export file',
    args: [
      {name: 'file', desciption: 'JSON export file name'}
    ],
    flags: [
      {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: function (context) {
      api.withUserConnections(context.auth.password, context.app, context.flags).then(function(connections){
          if (connections.length > 1) {
            console.log("Multiple connections found. Please use '-r' to specify a single connection by resource name.");
          } else {
            let connection = connections[0];
            let url = 'https://' + api.HOST + ':443' + '/api/v3/connections/' + connection.id + '/actions/import';
            fs.readFile(context.args.file, 'utf8', function(err, data) {
              data = JSON.parse(data);
              api.request(context.auth.password, 'POST', url, data).then(function(response) {
                console.log("Upload complete");
                console.log(response.text);
              });
            });
          }
      });
    }
};
