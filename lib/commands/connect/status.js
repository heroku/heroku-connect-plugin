'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');

function connections_status(connections) {
    if (connections.length == 0) {
      console.log("No connections found");
    }
    connections.forEach(function(connection) {
      api.connection_info(connection, true);
      console.log("");
    });
}

module.exports = {
    topic: 'connect',
    command: 'status',
    default: false,
    description: 'display connection status information',
    help: 'display connection status information',
    flags: [
      {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(function (context, heroku) {
      return api.withUserConnections(context.auth.password, context.app, context.flags, true, heroku).then(function(connections){
          if (connections.length === 0) {
            console.log("No connection found, requesting auth...");
            api.requestAppAccess(context.auth.password, context.app).then(function() {
              api.withUserConnections(context.auth.password, context.app, context.flags, false, heroku).then(function(connections){
                connections_status(connections);
              });          
            });
          } else {
            connections_status(connections);
          }
      });
    })
};
