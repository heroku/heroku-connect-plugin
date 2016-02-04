'use strict';
var api = require('./shared.js');
var cli = require('heroku-cli-util');
var co  = require('co');

module.exports = {
    topic: 'connect',
    command: 'resume',
    description: 'Resume a connection',
    help: 'Resumes a paused connection',
    flags: [
      {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(co.wrap(function* (context, heroku) {
      var connection = yield api.withConnection(context, heroku);
      var url = '/api/v3/connections/' + connection.id + '/actions/resume';
      var response = yield api.request(context.auth.password, 'POST', url);

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
