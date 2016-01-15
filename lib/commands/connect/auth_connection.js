'use strict';
let cli = require('heroku-cli-util');
let api = require('./shared.js');
let open = require('open');
let http = require('http');
let url = require('url');

function callbackServer() {
  let server = http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/html"});
    console.log("Authorization complete");
    let res = "<html><body><h3>Authorization complete</h3><p>You may close this window and return to the terminal to continue.</p></body></html>";
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
              let args = {'environment':'production', 'next': 'http://127.0.0.1:18000'};
              if (context.flags.login) {
                args.login_url = context.flags.login;
              }
              api.request(context.auth.password,
                'POST', '/api/v3/connections/' + connections[0].id + '/authorize_url', args).then(function(response) {
                  let redir = response.json.redirect;
                  console.log("Redirecting to Salesforce for authorization");
                  open(redir);
              });
            } catch (e) {console.log(e)};
          } else {
            console.log("No connection found");
          }
        });
    })
}
