'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');
let co  = require('co');
let fs  = require('fs');

module.exports = {
    topic: 'connect',
    command: 'export',
    description: 'Export configuration from a connection',
    help: 'Exports the mapping configuration from a connection as a json file',
    flags: [
      {name: 'resource', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(co.wrap(function* (context, heroku) {
      let connection = yield api.withConnection(context, heroku);
      let url = '/api/v3/connections/' + connection.id + '/actions/export';
      let response = yield api.request(context.auth.password, 'GET', url)
      let fName = connection.app_name + "-" + (connection.resource_name || '') + ".json";

      fs.writeFile(fName, JSON.stringify(response.json, null, 4), function(err) {
        if(err) {
          return cli.error(err);
        } else {
          console.log("Saved config file: ", fName);
        }
      });
    }))
};
