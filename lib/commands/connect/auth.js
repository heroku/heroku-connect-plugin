'use strict';
var api = require('./shared.js');
let cli = require('heroku-cli-util');
let co  = require('co');
let http = require('http');

const LOCAL_PORT = 18000;

function callbackServer() {
  // Create a local server that can receive the user after authoriztion is complete
  let server = http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/html"});
    console.log("Authorization complete");
    let res = "<html><body><h3>Authorization complete</h3><p>You may close this window and return to the terminal to continue.</p></body></html>";
    response.end(res);
    process.exit();
  });
  server.listen(LOCAL_PORT);
}

module.exports = {
  topic: 'connect',
  command: 'auth',
  description: 'get Salesforce authorization URL',
  help: 'return an URL to authorize a connection to a Salesforce Org',
  flags: [
    {name: 'callback', char: 'c', description: 'final callback URL', hasValue: true},
    {name: 'login', char: 'l', description: 'alternate Salesforce login URL', hasValue: true},
    {name: 'resource', description: 'specific connection resource name', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    let connection = yield api.withConnection(context, heroku);
    callbackServer();

    let url = '/api/v3/connections/' + connection.id + '/authorize_url';
    let args = {
      'environment':'production',
      // Redirect to the local server created in callbackServer(), so the CLI
      // can respond immediately after successful authorization
      'next': `http://localhost:${LOCAL_PORT}`
    };
    if (context.flags.login) {
      args.login_url = context.flags.login;
    }

    let response = yield api.request(context.auth.password, 'POST', url, args);
    let redir = response.json.redirect;

    console.log("Launching Salesforce for authorization. If your browser doesn't open, please copy the following URL to proceed:\n\n" + redir + "\n");
    yield cli.open(redir);
  }))
}
