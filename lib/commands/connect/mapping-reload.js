'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');
let co  = require('co');

module.exports = {
  topic: 'connect',
  command: 'mapping:reload',
  description: "reload a mapping's data from Salesforce",
  help: "reload a mapping's data from Salesforce",
  args: [
    {name: 'mapping'}
  ],
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    yield cli.action('reloading mapping', co(function* () {
      let connection = yield api.withConnection(context, heroku);
      let mapping = yield api.withMapping(connection, context.args.mapping);

      let response = yield api.request(context.auth.password, 'POST', '/api/v3/mappings/' + mapping.id + '/actions/reload');
      if (response.statusCode !== 202) {
        throw new Error(response.json.message || 'unknown error');
      }
    }));
  }))
};
