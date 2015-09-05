'use strict';
let cli = require('heroku-cli-util');
var api = require('./shared.js');

function connection_info(conn) {
    console.log('Connection [' + conn.guid + ' / ' + conn.resource_name + '] ' + '(' + conn.state + ')');
    conn.mappings.forEach(function(mapping) {
      console.log('--> ' + mapping.object_name + ' (' + mapping.state + ')');
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
    run: function (context) {
      api.withUserConnections(context.auth.password, context.app, context.flags).then(function(connections){
          connections.forEach(function(connection) {
            connection_info(connection);
            console.log("");
          });
      });
    }
};
