'use strict';
var api = require('./shared.js');
let cli = require('heroku-cli-util');

module.exports = {
    topic: 'connect',
    command: 'restart',
    description: 'Restart a connection',
    help: 'Clears errors and attempts to resume sync operations',
    flags: [
      {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(function (context, heroku) {
      api.withUserConnections(context.auth.password, context.app, context.flags, false, heroku).then(function(connections){
          if (connections.length > 1) {
            console.log("Multiple connections found. Please use '-r' to specify a single connection by resource name.");
            api.connection_info(connections);
          } else {
            connections.forEach(function(connection) {
              api.request(context.auth.password, 'POST', '/api/v3/connections/' + connection.id + '/actions/restart')
                .then(function(response) {
                  switch(response.statusCode) {
                    case 202:
                      console.log(api.connection_string(connection) + ' restarted');
                    break;
                    case 409:
                      console.log(response.json['message']);
                    break;
                  }
                });
            });
          }
      });
    })
};
