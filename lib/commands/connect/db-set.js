'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');
let co  = require('co');

module.exports = {
  topic: 'connect',
  command: 'db:set',
  description: 'Set database parameters',
  help: "Set a connection's database config var and schema name",
  args: [
     {name: 'db', description: 'Database config var name'},
     {name: 'schema', description: 'Database schema name'},
  ],
  flags: [
     {name: 'resource', description: 'specific connection resource name', hasValue: true},
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    let data = {
      db_key: context.args.db,
      schema_name: context.args.schema
    };

    let connection = yield api.withConnection(context, heroku);

    if (connection.state == 'NEW') {
      console.log("Configuring connection with\n", data);
      let url = '/api/v3/connections/' + connection.id;
      yield api.request(context.auth.password, 'PATCH', url, data);
      console.log("Setup complete");
    } else {
      console.log("Connection", connection.id, "already in state:", connection.state);
    }
  }))
};
