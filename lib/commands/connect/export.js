'use strict';
var api = require('./shared.js');
var fs = require('fs');
let cli = require('heroku-cli-util');

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
    run: cli.command(function (context, heroku) {
      api.withUserConnections(context.auth.password, context.app, context.flags, false, heroku).then(function(connections){
          if (connections.length > 1) {
            console.log("Multiple connections found. Please use '-r' to specify a single connection by resource name.");
            api.connection_info(connections);
          } else {
            connections.forEach(function(connection) {
              api.request(context.auth.password, 'GET', '/api/v3/connections/' + connection.id + '/actions/export')
                .then(function(response) {
                  let fName = connection.app_name + "-" + (connection.resource_name || '') + ".json";
                  fs.writeFile(fName, JSON.stringify(response.json, null, 4), function(err) {
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
    })
};
