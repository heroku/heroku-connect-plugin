'use strict';
let cli = require('heroku-cli-util');
var api = require('./shared.js');

function connection_info(conn) {
    console.log('Connection [' + conn.guid + ' / ' + conn.resource_name + '] ' + '(' + conn.state + ')');
    conn.mappings.forEach(function(mapping) {
      console.log('--> ' + mapping.object_name + ' (' + mapping.state + ')');
    });
}

module.exports = {
    topic: 'connect',
    command: 'setup',
    description: 'configure a new connection',
    help: 'Configure a connection with db key and SF auth',
    flags: [
       {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true},
       {name: 'db', char: 'd', description: 'database config var name', hasValue: true},
       {name: 'schema', char: 's', description: 'database schema name', hasValue: true},
       {name: 'token', char: 't', description: 'SF preauth token', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: function (context) {
      let schema = context.flags.schema || 'salesforce';
      let db = context.flags.db || 'DATABASE_URL';

      let data = {schema_name:schema, db_key:db};
      if (context.flags.token) {
        data.preauth_token = context.flags.token;
      }
      console.log(context.auth.password);
      api.withUserConnections(context.auth.password, context.app, context.flags).then(function(connections){
          connections.forEach(function(connection) {
            if (connection.state == 'NEW') {
              console.log("Configuring connection with\n", data);
              api.request(context.auth.password, 'PATCH', '/api/v3/connections/' + connection.guid, data).then(function(response) {
                console.log("Patch result ", response);
              });
            } else {
              console.log("Connection ", connection, " already in state: ", connection.state);
            }
          });
      });
    }
};
