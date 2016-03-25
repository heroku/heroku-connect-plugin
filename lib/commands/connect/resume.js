'use strict';
let api = require('./shared.js');
let cli = require('heroku-cli-util');
let co  = require('co');

module.exports = {
  topic: 'connect',
  command: 'resume',
  description: 'Resume a connection',
  help: 'Resumes a paused connection',
  flags: [
    {name: 'resource', description: 'specific connection resource name', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    let connection = yield api.withConnection(context, heroku);
    let url = '/api/v3/connections/' + connection.id + '/actions/resume';
    let response = yield api.request(context.auth.password, 'POST', url);

    switch(response.statusCode) {
      case 202:
        console.log(api.connection_string(connection) + ' resumed');
      break;
      case 409:
        console.log(response.json['message']);
      break;
      default:
        cli.debug(response);
    }
  }))
};
