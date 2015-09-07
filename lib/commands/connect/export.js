'use strict';
var api = require('./shared.js');
var fs = require('fs');

module.exports = {
    topic: 'connect',
    command: 'export',
    description: 'Export configuration from a connection',
    help: 'Exports the mapping configuration from a connection as a json file',
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
            connections.forEach(function(connection) {
              api.request(context.auth.password, 'GET', '/api/v3/connections/' + connection.guid + '/actions/export')
                .then(function(response) {
                  let fName = connection.app_name + "-" + (connection.resource_name || '') + ".json";
                  fs.writeFile(fName, JSON.stringify(response.json), function(err) {
                    if(err) {
                        return console.log(err);
                    } else {
                      console.log("Saved config file: ", fName);
                    }
                  });
                });
            });
          }
      });
    }
};
