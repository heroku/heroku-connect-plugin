'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');
let co  = require('co');

module.exports = {
  topic: 'connect',
  command: 'mapping:state',
  description: 'return a mapping state',
  help: 'return a mapping state',
  args: [
    {name: 'mapping'}
  ],
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    let connection = yield api.withConnection(context, heroku);
    let mapping = yield api.withMapping(connection, context.args.mapping);

    console.log(mapping.state);
  }))
};
