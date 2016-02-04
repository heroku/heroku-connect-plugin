'use strict';
var api = require('./shared.js');
var cli = require('heroku-cli-util');
var co  = require('co');

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
    run: cli.command(co.wrap(function* (context, heroku) {
      var connections = yield api.withUserConnections(context.auth.password, context.app, context.flags, heroku);

      connections.forEach(function(connection) {
        console.log(connection.state);
      });
    }))
};
