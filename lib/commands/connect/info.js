'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');
let co  = require('co');

module.exports = {
    topic: 'connect',
    command: 'info',
    default: false,
    description: 'display connection information',
    help: 'display connection information',
    flags: [
      {name: 'resource', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(co.wrap(function* (context, heroku) {
      let connections = yield api.withUserConnections(context.auth.password, context.app, context.flags, true, heroku);

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
