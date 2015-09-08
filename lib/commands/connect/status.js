'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');

function connection_info(conn) {
    console.log('Connection [' + conn.guid + ' / ' + conn.resource_name + '] ' + '(' + conn.state + ')');
    conn.mappings.forEach(function(mapping) {
      console.log('--> ' + mapping.object_name + ' (' + mapping.state + ')');
    });
}

function connections_status(connections) {
    if (connections.length == 0) {
      console.log("No connections found");
    }
    connections.forEach(function(connection) {
      connection_info(connection);
      console.log("");
    });
}

module.exports = {
    topic: 'connect',
    command: 'status',
    default: true,
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
