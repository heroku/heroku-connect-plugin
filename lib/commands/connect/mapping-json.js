'use strict';
var api = require('./shared.js');
var cli = require('heroku-cli-util');
var co  = require('co');

module.exports = {
    topic: 'connect',
    command: 'mapping:json',
    description: 'return a mapping status json doc',
    help: 'return a mapping status json doc',
    args: [ {name: 'mapping'}],
    flags: [
      {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(co.wrap(function* (context, heroku) {
      var connection = yield api.withConnection(context, heroku);
      var mapping = yield api.withMapping(connection, context.args.mapping);

      console.log(JSON.stringify(mapping));
    }))
};
