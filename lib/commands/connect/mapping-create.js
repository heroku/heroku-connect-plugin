'use strict';
var Q = require('q');
var api = require('./shared.js');
var cli = require('heroku-cli-util');

module.exports = {
    topic: 'connect',
    command: 'mapping:create',
    description: 'create a new mapping',
    help: 'create a new mapping',
    args: [
      {
        name: 'mapping',
        optional: false
      }
    ],
    flags: [
      {
        name: 'resource', 
        char: 'r', 
        description: 'specific connection resource name', 
        hasValue: true
      },
      {
        name: 'with-required',
        description: 'include all required fields',
        hasValue: false
      },
      {
        name: 'fields',
        description: 'comma separated list of field names, e.g. --fields=Field1,Field2,...',
        hasValue: true
      },
      {
        name: 'mode',
        description: 'sync mode, choices: read, write. e.g. --mode=read',
        hasValue: true
      },
      {
        name: 'polling',
        description: 'polling interval in seconds, default: 600',
        hasValue: true
      },
      {
        name: 'evented',
        description: 'use SalesForce streaming API',
        hasValue: false
      }
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(function (context, heroku) {
      var config = {
        sf_max_daily_api_calls: 3000
      };

      api.withConnection(context, heroku).then(function(connection) {
        if (!context.flags['with-required'] && !context.flags.fields) {
          console.log('You must specify fields using either the --with-required or --fields flags.');
          return;
        }

        // access mode
        var mode = context.flags.mode;
        if (!mode) mode = 'read';
        if (['read', 'write'].indexOf(mode) === -1) {
          console.log('Must provide a valid sync mode value.');
          return;
        }
        else {
          config.access = mode === 'read' ? 'read_only' : 'read_write';
        }

        // polling time
        var pollInterval = context.flags.polling;
        if (!pollInterval || isNaN(+pollInterval)) {
          pollInterval = 600;
        }
        config.sf_polling_seconds = pollInterval;

        // evented
        config.sf_notify_enabled = !!context.flags.evented;

        var fieldNames = context.flags.fields ? context.flags.fields.split(',') : [];
        var fieldsPromise;

        if (context.flags['with-required']) {
          // figure out required fields
          console.log('Checking for required fields ...');
          fieldsPromise = api.withRequiredFields(context.auth.password, connection.id, context.args.mapping)
          .then(function(requiredFields){
            return requiredFields.concat(fieldNames);
          });
        }
        else {
          fieldsPromise = Q(fieldNames);
        }

        // we have all fields, create mapping!
        fieldsPromise.then(function(fieldNames){
          config.fields = {};
          for (var i = 0, l = fieldNames.length; i < l; i++) {
            config.fields[fieldNames[i]] = {};
          }

          var payload = {
            object_name: context.args.mapping,
            config: config
          };

          api.request(context.auth.password, 'POST', '/api/v3/connections/' + connection.id + '/mappings', payload)
          .then(function(response){
            if (response.statusCode === 201) {
              console.log('Mapping created!');
            }
            else {
              console.log('Received unexpected resonse during mapping creation ...');
              api.printResponseError(response);
            }
          });
        });
      });
    })
};