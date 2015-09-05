'use strict';
let cli = require('heroku-cli-util');
var api = require('./shared.js');

function connection_mapping_info(conn, mapping_name) {
    conn.mappings.forEach(function(mapping) {
      if (mapping.object_name.indexOf(mapping_name) == 0) {
        console.log(JSON.stringify(mapping));
      }
    });
}

module.exports = {
    topic: 'connect',
    command: 'mapping',
    description: 'display mapping status information',
    help: 'display mapping status information',
    flags: [
      {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true},
      {name: 'mapping', char: 'm', description: 'mapping object name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: function (context) {
      api.global_config(context);

      if (!context.flags.mapping) {
        console.log("You must supply a mapping name using -m");
      } else {
        api.withUserConnections(context.auth.password, context.app, context.flags).then(function(connections){
            if (connections.length == 0) {
              console.log("No connection(s) found");
            }
            connections.forEach(function(connection) {
              connection_mapping_info(connection, context.flags.mapping);
            });
        });
      }
    }
};
