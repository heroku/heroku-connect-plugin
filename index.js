var https = require('https');
var opts = {
  hostname: 'connect.heroku.com',
  port: 443,
  method: 'GET'
}
var me_path = '/api/v2/users/me?deep=true';

function connection_info(conn) {
    console.log("Overall: " + conn.state);
    conn.mappings.forEach(function(mapping) {
      if (mapping.state == 'DATA_SYNCED') {
        console.log("--> ✓ " + mapping.object_name);
      } else {
        console.log("--> x " + mapping.object_name + ": " + mapping.state);
      }
    });
}

exports.topics = [{
  name: 'connect',
  description: 'a topic for the hello world plugin'
}];

exports.commands = [
  {
    topic: 'connect',
    command: 'status',
    description: 'Status of your Heroku Connect connection',
    help: 'Status of your Heroku Connect connection',
    flags: [
      {name: 'user', char: 'u', description: 'user to say hello to', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: function (context) {
      opts.headers = {Authorization: 'Heroku ' + context.auth.password};
      opts.path = me_path;
      var req = https.request(opts, function(res) {
        var body = '';
        res.on('data', function(d) {
          body += d;
        });
        res.on('end', function() {
          body = JSON.parse(body);
          body.instances.forEach(function(instance) {
            if (instance.name == context.app) {
              instance.connections.forEach(function(connection) {
                connection_info(connection);
              });
            }
          });
        });
      });
      req.end();
    }
  }
];
