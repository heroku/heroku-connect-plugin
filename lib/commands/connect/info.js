'use strict';
var api = require('./shared.js');
var cli = require('heroku-cli-util');
var co  = require('co');

module.exports = {
    topic: 'connect',
    command: 'info',
    default: false,
    description: 'display connection information',
    help: 'display connection information',
    flags: [
      {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(co.wrap(function* (context, heroku) {
      var connections = yield api.withUserConnections(context.auth.password, context.app, context.flags, true, heroku);

      if (connections.length === 0) {
        console.log("No connection found, requesting auth...");
        yield api.requestAppAccess(context.auth.password, context.app);
        connections = yield api.withUserConnections(context.auth.password, context.app, context.flags, false, heroku);
      }

      if (connections.length == 0) {
        console.log("No connections found");
      }

      connections.forEach(function(connection) {
        api.connection_info(connection, true);
        console.log("");
      });
    }))
};
