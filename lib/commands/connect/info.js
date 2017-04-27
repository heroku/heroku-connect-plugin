'use strict';
let api = require('./shared.js');
let regions = require('./regions.js');
let cli = require('heroku-cli-util');
let co  = require('co');

module.exports = {
  topic: 'connect',
  command: 'info',
  default: false,
  description: 'display connection information',
  help: 'display connection information',
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    regions.flag,
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    context.region = regions.determineRegion(context);
    let connections = yield api.withUserConnections(context, context.app, context.flags, true, heroku);

    if (connections.length === 0) {
      console.log("No connection found, requesting auth...");
      yield api.requestAppAccess(context, context.app);
      connections = yield api.withUserConnections(context, context.app, context.flags, false, heroku);
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
