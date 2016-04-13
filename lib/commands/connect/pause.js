'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');
let co  = require('co');

module.exports = {
  topic: 'connect',
  command: 'pause',
  description: 'Pause a connection',
  help: 'Pauses an active connection',
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    yield cli.action('pausing connection', co(function* () {
      let connection = yield api.withConnection(context, heroku);
      let url = '/api/v3/connections/' + connection.id + '/actions/pause';
      yield api.request(context.auth.password, 'POST', url);
    }));
  }))
};
