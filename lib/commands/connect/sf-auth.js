'use strict';
var api = require('./shared.js');
let cli = require('heroku-cli-util');
let co  = require('co');
let http = require('http');

const LOCAL_PORT = 18000;

function callbackServer() {
  return new Promise(function(resolve, reject) {
    // Create a local server that can receive the user after authoriztion is complete
    http.createServer(function (request, response) {
      // Notify the user that the the authorization is complete
      response.writeHead(200, {"Content-Type": "text/html"});
      let res = "<html><body><h3>Authorization complete</h3><p>You may close this window and return to the terminal to continue.</p></body></html>";
      response.end(res);

      // Shut down the server so the command can exit
      request.connection.destroy();
      this.close();

      // Return control to the main command
      resolve();
    }).listen(LOCAL_PORT);
  });
}

module.exports = {
  topic: 'connect',
  command: 'sf:auth',
  description: 'Authorize access to Salesforce for your connection',
  help: 'Opens a browser to authorize a connection to a Salesforce Org',
  flags: [
    {name: 'callback', char: 'c', description: 'final callback URL', hasValue: true},
    {name: 'login', char: 'l', description: 'alternate Salesforce login URL', hasValue: true},
    {name: 'resource', description: 'specific connection resource name', hasValue: true}
  ],
  needsApp: true,
  needsAuth: true,
  run: cli.command(co.wrap(function* (context, heroku) {
    let connection = yield api.withConnection(context, heroku);

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
    yield callbackServer();
  }))
}
