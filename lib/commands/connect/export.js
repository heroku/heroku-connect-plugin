'use strict';
var api = require('./shared.js');
var cli = require('heroku-cli-util');
var co  = require('co');
var fs  = require('fs');

module.exports = {
    topic: 'connect',
    command: 'export',
    description: 'Export configuration from a connection',
    help: 'Exports the mapping configuration from a connection as a json file',
    flags: [
      {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(co.wrap(function* (context, heroku) {
      var connection = yield api.withConnection(context, heroku);
      var url = '/api/v3/connections/' + connection.id + '/actions/export';
      var response = yield api.request(context.auth.password, 'GET', url)
      var fName = connection.app_name + "-" + (connection.resource_name || '') + ".json";

      fs.writeFile(fName, JSON.stringify(response.json, null, 4), function(err) {
        if(err) {
          return cli.error(err);
        } else {
          console.log("Saved config file: ", fName);
        }
      });
    }))
};
