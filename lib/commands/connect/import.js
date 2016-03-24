'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');
let co  = require('co');
let fs  = require('fs');

module.exports = {
    topic: 'connect',
    command: 'import',
    description: 'Import configuration from an export file',
    help: 'Imports the mapping configuration from a json export file',
    args: [
      {name: 'file', desciption: 'JSON export file name'}
    ],
    flags: [
      {name: 'resource', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(co.wrap(function* (context, heroku) {
      let connection = yield api.withConnection(context, heroku);
      let url = '/api/v3/connections/' + connection.id + '/actions/import';
      fs.readFile(context.args.file, 'utf8', co.wrap(function* (err, data) {
        data = JSON.parse(data);
        let response = yield api.request(context.auth.password, 'POST', url, data);
        console.log("Upload complete");
        console.log(response.text);
      }));
    }))
};
