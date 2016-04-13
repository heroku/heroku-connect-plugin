'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');
let co  = require('co');

module.exports = {
  topic: 'connect',
  command: 'mapping:delete',
  description: 'delete an existing mapping',
  help: 'delete an existing mapping',
  args: [
    {name: 'mapping'}
  ],
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true},
    {name: 'confirm', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    yield cli.confirmApp(context.app, context.flags.confirm);

    yield cli.action('deleting mapping', co(function* () {
      let connection = yield api.withConnection(context, heroku);
      let mapping = yield api.withMapping(connection, context.args.mapping);
      let response = yield api.request(context.auth.password, 'DELETE', '/api/v3/mappings/' + mapping.id);
      if (response.statusCode !== 204) {
        throw new Error(response.json.message || 'unknown error');
      }
    }));
  }))
};
