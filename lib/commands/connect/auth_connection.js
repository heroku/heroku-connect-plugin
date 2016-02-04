'use strict';
var cli = require('heroku-cli-util');
var api = require('./shared.js');
var open = require('open');
var http = require('http');
var url = require('url');

function callbackServer() {
  var server = http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/html"});
    console.log("Authorization complete");
    var res = "<html><body><h3>Authorization complete</h3><p>You may close this window and return to the terminal to continue.</p></body></html>";
    response.end(res);
    process.exit();
  });
  server.listen(18000);
}

module.exports = {
    topic: 'connect',
    command: 'auth',
    description: 'get Salesforce authorization URL',
    help: 'return an URL to authorize a connection to a Salesforce Org',
    flags: [
       {name: 'callback', char: 'c', description: 'final callback URL', hasValue: true},
       {name: 'login', char: 'l', description: 'alternate Salesforce login URL', hasValue: true}
    ],
    needsApp: true,
    needsAuth: true,
    run: cli.command(function (context, heroku) {
      return api.withUserConnections(context.auth.password, context.app, context.flags, true, heroku)
        .then(function(connections) {
          if (connections.length > 0) {
            callbackServer();

            try {
              var args = {'environment':'production', 'next': 'http://127.0.0.1:18000'};
              if (context.flags.login) {
                args.login_url = context.flags.login;
              }
              api.request(context.auth.password,
                'POST', '/api/v3/connections/' + connections[0].id + '/authorize_url', args).then(function(response) {
                  var redir = response.json.redirect;
                  console.log("Launching Salesforce for authorization. If your browser doesn't open, please copy the following URL to proceed:\n\n" + redir + "\n");
                  open(redir);
              });
            } catch (e) {console.log(e)};
          } else {
            console.log("No connection found");
          }
        });
    })
}
