'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');
let co  = require('co');
let inquirer = require('inquirer');

let fetchKeys = co.wrap(function* (app_name, context) {
  let url = '/api/v3/apps/' + app_name;
  let response = yield api.request(context.auth.password, 'GET', url);
  let keys = [];//new Array(response.json.db_keys.length);
  response.json.db_keys.forEach(function(key) {
    keys.push({
      name: `${key.name} (${key.addon.plan})`,
      value: key.name
    });
  })
  return yield Promise.resolve(keys);
});

module.exports = {
  topic: 'connect',
  command: 'db:set',
  description: 'Set database parameters',
  help: "Set a connection's database config var and schema name",
  flags: [
     {name: 'resource', description: 'specific connection resource name', hasValue: true},
     {name: 'db', description: 'Database config var name', hasValue: true},
     {name: 'schema', description: 'Database schema name', hasValue: true},
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    let data = {
      db_key: context.flags.db,
      schema_name: context.flags.schema
    };

    let connection = yield api.withConnection(context, heroku);

    inquirer.prompt([
      {
        name: 'db_key',
        type: 'list',
        message: "Select the config var that points to the database you'd like to use",
        choices: yield fetchKeys(connection.app_name, context),
        when: !context.flags.db
      },
      {
        name: 'schema_name',
        message: "Enter a schema name you'd like to use for the conneted data",
        default: context.flags.schema || 'salesforce',
        when: !context.flags.schema
      }
    ], function(answers) {
      for(let key in answers) {
        data[key] = answers[key];
      }

      cli.debug(data);

      if (connection.state == 'NEW') {
        console.log("Configuring connection with\n", data);
        let url = '/api/v3/connections/' + connection.id;
        yield api.request(context.auth.password, 'PATCH', url, data);
        console.log("Setup complete");
      } else {
        console.log("Connection", connection.id, "already in state:", connection.state);
      }
    })

  }))
};
