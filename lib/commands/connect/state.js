'use strict';
var api = require('./shared.js');

module.exports = {
    topic: 'connect',
    command: 'state',
    description: 'return the connection(s) state',
    help: 'returns the state key of the selected connections',
    flags: [
      {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: function (context) {
      api.withUserConnections(context.auth.password, context.app, context.flags).then(function(connections){
          connections.forEach(function(connection) {
            console.log(connection.state);
          });
      });
    }
};
