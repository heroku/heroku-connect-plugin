'use strict';
var api = require('./shared.js');
var cli = require('heroku-cli-util');
var co  = require('co');

module.exports = {
  topic: 'connect',
  command: 'json',
  description: 'return a connection JSON document',
  help: 'return a connection JSON document',
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true}
  ],
  wantsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    var connection = yield api.withConnection(context, heroku);

    console.log(JSON.stringify(connection));
  }))
};
