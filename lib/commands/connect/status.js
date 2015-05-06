var api = require('./shared.js');

function connection_info(conn) {
    console.log('Connection #' + conn.id + ' (' + conn.state + ')');
    conn.mappings.forEach(function(mapping) {
      console.log('--> ' + mapping.object_name + ' (' + mapping.state + ')');
    });
}

module.exports = {
    topic: 'connect',
    command: 'status',
    description: 'display connection status information',
    help: 'display connection status information',
    // flags: [
    //   {name: 'user', char: 'u', description: 'user to say hello to', hasValue: true}
    // ],
    needsApp: true,
    needsAuth: true,
    run: function (context) {
      api.withUserInstance(context.auth.password, context.app).then(function(instance){
          instance.connections.forEach(function(connection) {
            connection_info(connection);
            console.log("");
          });
      });
    }
};