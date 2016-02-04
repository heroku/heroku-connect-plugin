'use strict';
var api = require('./shared.js');
var cli = require('heroku-cli-util');
var co  = require('co');
var fs  = require('fs');

module.exports = {
    topic: 'connect',
    command: 'import',
    description: 'Import configuration from an export file',
    help: 'Imports the mapping configuration from a json export file',
    args: [
      {name: 'file', desciption: 'JSON export file name'}
    ],
    flags: [
      {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(co.wrap(function* (context, heroku) {
      var connection = yield api.withConnection(context, heroku);
      var url = '/api/v3/connections/' + connection.id + '/actions/import';
      fs.readFile(context.args.file, 'utf8', co.wrap(function* (err, data) {
        data = JSON.parse(data);
        var response = yield api.request(context.auth.password, 'POST', url, data);
        console.log("Upload complete");
        console.log(response.text);
      }));
    }))
};
