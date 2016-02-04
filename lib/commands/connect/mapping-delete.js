'use strict';
var Q = require('q');
var api = require('./shared.js');
let cli = require('heroku-cli-util');

module.exports = {
    topic: 'connect',
    command: 'mapping:delete',
    description: 'delete an existing mapping',
    help: 'delete an existing mapping',
    args: [
      {
        name: 'mapping',
        optional: false
      }
    ],

    flags: [
      {name: 'resource', char: 'r', description: 'specific connection resource name', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(function (context, heroku) {
      api.withConnection(context, heroku).then(function(connection){
        connection.mappings.forEach(function(mapping) {
          if (mapping.object_name == context.args.mapping) {
            api.request(context.auth.password, 'DELETE', '/api/v3/mappings/' + mapping.id).then(function(response){
              if (response.statusCode === 204) {
                console.log('Mapping deleted.');
              }
              else {
                console.log('Received unexpected response during mapping delete ...');
                api.printResponseError(response);
              }
            });
            return;
          }
        });
      });
    })
};