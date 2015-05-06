var Q = require('q');
var api = require('./shared.js');


module.exports = {
    topic: 'connect',
    command: 'delete-mapping',
    description: 'delete an existing mapping',
    help: 'delete an existing mapping',
    args: [
      {
        name: 'object',
        optional: false
      }
    ],
    flags: [
      {
        name: 'connection',
        description: 'connection ID for the mapping',
        hasValue: true
      }
    ],
    needsApp: true,
    needsAuth: true,
    run: function (context) {
      var connectionId = +context.flags.connection;
      if (!connectionId) {
        console.log('Missing required --connection flag.');
        return;
      }

      var mappingIdPromise;
      if (isNaN(+context.args.object)) {
        var objectName = context.args.object;
        console.log('Looking up mapping for "' + objectName + '" ...');

        mappingIdPromise = api.withConnectionMappings(context.auth.password, connectionId).then(function(mappings){
          return Q.Promise(function(resolve, reject){
            var mappingId = null;
            for (var i = 0, l = mappings.length; i < l; i++) {
              if (mappings[i].object_name === objectName) {
                mappingId = mappings[i].id;
                break;
              }
            }

            if (mappingId !== null) {
              resolve(mappingId);
            }
            else {
              var mappingNames = mappings.map(function(mapping){
                return mapping.object_name;
              });
              console.log('Unable to find mapping for "' + objectName + '" for connection ID ' + connectionId + ', choices are: ' + mappingNames.join(', '));
              reject(null);
            }
          });
        });
      }
      else {
        mappingIdPromise = Q.Promise(+context.args.object);
      }

      mappingIdPromise.then(function(mappingId){
        api.request(context.auth.password, 'DELETE', '/api/v2/mappings/' + mappingId).then(function(response){
          if (response.statusCode === 204) {
            console.log('Mapping deleted.');
          }
          else {
            console.log('Received unexpected response during mapping delete ...');
            api.printResponseError(response);
          }
        });
      });
    }
};